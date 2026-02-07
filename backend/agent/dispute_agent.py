"""Dispute Investigation Agent using LangChain + Ollama

Reuses the same ReAct prompt-based pattern from investigator.py but tailored
for customer dispute resolution. Analyzes the customer's claim against
transaction evidence and makes a fair determination.
"""

import logging
import re
import json
from datetime import datetime
from typing import Callable, Awaitable, Optional

from backend.agent.tools import (
    check_account_history,
    verify_merchant,
)
from backend.agent.dispute_tools import (
    get_dispute_context,
    check_customer_dispute_history,
    resolve_dispute,
)

logger = logging.getLogger(__name__)

DISPUTE_TOOL_MAP = {
    "check_account_history": check_account_history,
    "verify_merchant": verify_merchant,
    "get_dispute_context": get_dispute_context,
    "check_customer_dispute_history": check_customer_dispute_history,
    "resolve_dispute": resolve_dispute,
}

DISPUTE_SYSTEM_PROMPT = """You are a customer dispute analyst AI in a banking security system. Your role is to fairly evaluate customer disputes against transaction evidence.

You must balance customer protection with fraud prevention. Analyze the evidence objectively:
- Was the transaction authorized?
- Does the customer's claim match the transaction evidence?
- Is there a history of dispute abuse?
- Was this transaction already flagged as fraudulent?

Investigation process:
1. Review the dispute details and customer's claim
2. Get the original transaction context (check if it was flagged as fraud)
3. Check the account's transaction history for patterns
4. Verify the merchant's legitimacy
5. Check the customer's dispute history
6. Make your resolution: APPROVE (refund), DENY (reject), or ESCALATE (human review)

Be fair but vigilant. Legitimate disputes should be approved quickly. Suspicious patterns should be escalated."""

DISPUTE_TOOL_DESCRIPTIONS = """You have access to the following tools:

1. get_dispute_context(transaction_id: str) - Get original transaction details and any fraud alert/verdict
2. check_account_history(account_id: str) - Check recent transaction history for patterns
3. verify_merchant(merchant_id: str) - Verify merchant legitimacy and business details
4. check_customer_dispute_history(account_id: str) - Check past dispute count, approval rate, patterns
5. resolve_dispute(action: str, summary: str) - Submit final resolution: APPROVE, DENY, or ESCALATE

To use a tool, output EXACTLY this format:
Action: tool_name
Action Input: {"param1": "value1", "param2": "value2"}

After seeing the tool result, continue your analysis. When done, use the resolve_dispute tool with your final decision.

IMPORTANT: You MUST use the resolve_dispute tool as your final step."""

DISPUTE_REACT_PROMPT = """{system_prompt}

{tool_descriptions}

Investigate the following customer dispute step by step. Think carefully, use tools to gather evidence, then make your resolution.

DISPUTE DETAILS:
  Dispute ID: {dispute_id}
  Transaction ID: {transaction_id}
  Account: {account_id}
  Merchant: {merchant_name}
  Amount: ${amount:.2f}
  Dispute Reason: {reason}
  Customer Statement: "{customer_statement}"
  Filed At: {timestamp}

Begin your investigation. Start with a Thought, then take an Action."""


class DisputeInvestigatorAgent:
    """AI agent that investigates customer disputes using ReAct prompting"""

    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        model: str = "llama3.2:3b",
        broadcast_fn: Optional[Callable[[str, dict], Awaitable[None]]] = None,
    ):
        self.ollama_base_url = ollama_base_url
        self.model = model
        self.broadcast_fn = broadcast_fn
        self._llm = None

    def _get_llm(self):
        if self._llm is not None:
            return self._llm
        from langchain_ollama import ChatOllama
        self._llm = ChatOllama(
            base_url=self.ollama_base_url,
            model=self.model,
            temperature=0.1,
            num_predict=2048,
        )
        return self._llm

    async def _emit_trace(self, dispute_id: str, step_type: str, content: str):
        if self.broadcast_fn:
            await self.broadcast_fn("dispute_trace", {
                "dispute_id": dispute_id,
                "step_type": step_type,
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
            })

    def _parse_action(self, text: str):
        """Parse Action and Action Input from LLM output"""
        action_match = re.search(r'Action:\s*(\w+)', text)
        if not action_match:
            return None, None

        tool_name = action_match.group(1).strip()

        # Try JSON format
        input_match = re.search(r'Action Input:\s*({[^}]+})', text)
        if input_match:
            try:
                tool_input = json.loads(input_match.group(1))
                return tool_name, tool_input
            except json.JSONDecodeError:
                pass

        # Special handling for resolve_dispute
        if tool_name == "resolve_dispute":
            action_val = "ESCALATE"
            text_upper = text.upper()
            if "APPROVE" in text_upper:
                action_val = "APPROVE"
            elif "DENY" in text_upper:
                action_val = "DENY"
            summary_match = re.search(
                r'(?:summary|reason|because|conclusion)[:\s]*([^\n]+)',
                text, re.IGNORECASE
            )
            summary = summary_match.group(1).strip() if summary_match else "Based on investigation findings."
            return tool_name, {"action": action_val, "summary": summary[:300]}

        # Simpler format: Action Input: value
        input_match = re.search(r'Action Input:\s*"?([^"\n]+)"?', text)
        if input_match:
            raw_input = input_match.group(1).strip()
            if tool_name in ("check_account_history", "check_customer_dispute_history"):
                return tool_name, {"account_id": raw_input}
            elif tool_name == "verify_merchant":
                return tool_name, {"merchant_id": raw_input}
            elif tool_name == "get_dispute_context":
                return tool_name, {"transaction_id": raw_input}
            else:
                return tool_name, {"input": raw_input}

        return None, None

    def _execute_tool(self, tool_name: str, tool_input: dict) -> str:
        tool_fn = DISPUTE_TOOL_MAP.get(tool_name)
        if not tool_fn:
            return f"Error: Unknown tool '{tool_name}'. Available: {list(DISPUTE_TOOL_MAP.keys())}"
        try:
            result = tool_fn.invoke(tool_input)
            return str(result)
        except Exception as e:
            logger.error(f"Dispute tool {tool_name} failed: {e}")
            return f"Error executing {tool_name}: {str(e)}"

    def _auto_resolve(self, dispute_data: dict) -> str:
        """Auto-resolve when LLM fails to call resolve_dispute"""
        reason = dispute_data.get("reason", "")
        amount = dispute_data.get("amount", 0)

        # Simple heuristic fallback
        if reason in ("unauthorized_charge", "fraud_claim"):
            action = "APPROVE"
            summary = f"Auto-approved: Customer reported {reason} for ${amount:.2f}. Refund recommended."
        elif reason == "duplicate":
            action = "APPROVE"
            summary = f"Auto-approved: Duplicate charge of ${amount:.2f} identified."
        elif amount > 5000:
            action = "ESCALATE"
            summary = f"High-value dispute (${amount:.2f}) escalated for manual review."
        else:
            action = "ESCALATE"
            summary = f"Dispute for ${amount:.2f} escalated - insufficient evidence for auto-resolution."

        return f"DISPUTE RESOLUTION: {action}\nSummary: {summary}"

    async def investigate(self, dispute_data: dict) -> dict:
        """Run a full dispute investigation using ReAct loop"""
        dispute_id = dispute_data.get("id", "unknown")

        full_prompt = DISPUTE_REACT_PROMPT.format(
            system_prompt=DISPUTE_SYSTEM_PROMPT,
            tool_descriptions=DISPUTE_TOOL_DESCRIPTIONS,
            dispute_id=dispute_id,
            transaction_id=dispute_data.get("transaction_id", "unknown"),
            account_id=dispute_data.get("account_id", "unknown"),
            merchant_name=dispute_data.get("merchant_name", "Unknown"),
            amount=dispute_data.get("amount", 0),
            reason=dispute_data.get("reason", "unknown"),
            customer_statement=dispute_data.get("customer_statement", "No statement provided"),
            timestamp=dispute_data.get("timestamp", ""),
        )

        try:
            llm = self._get_llm()
            conversation = full_prompt
            max_steps = 6
            final_output = ""

            await self._emit_trace(dispute_id, "thinking", "Starting dispute investigation...")

            for step in range(max_steps):
                response = await llm.ainvoke(conversation)
                llm_text = response.content if hasattr(response, 'content') else str(response)

                # Extract thought
                thought_match = re.search(r'Thought:?\s*(.*?)(?=Action:|$)', llm_text, re.DOTALL)
                if thought_match:
                    thought = thought_match.group(1).strip()
                    if thought:
                        await self._emit_trace(dispute_id, "thinking", thought[:300])

                # Parse action
                tool_name, tool_input = self._parse_action(llm_text)

                if tool_name and tool_name in DISPUTE_TOOL_MAP:
                    await self._emit_trace(
                        dispute_id, "tool_call",
                        f"Calling: {tool_name}({json.dumps(tool_input)[:200]})"
                    )

                    tool_result = self._execute_tool(tool_name, tool_input)
                    await self._emit_trace(dispute_id, "tool_result", tool_result[:400])

                    if tool_name == "resolve_dispute":
                        final_output = tool_result
                        break

                    truncated_result = tool_result[:300]
                    conversation += f"\n{llm_text}\nObservation: {truncated_result}\n\nContinue. Use your next Action."
                else:
                    if any(kw in llm_text.upper() for kw in ["APPROVE", "DENY", "ESCALATE"]):
                        final_output = llm_text
                    break

            # Nudge if no resolution
            if not final_output:
                nudge = (
                    "\n\nYou have gathered enough evidence. Now you MUST call the resolve_dispute tool. "
                    "Output exactly:\n"
                    "Action: resolve_dispute\n"
                    'Action Input: {"action": "APPROVE", "summary": "your summary here"}\n\n'
                    "Choose APPROVE, DENY, or ESCALATE based on your findings."
                )
                conversation += nudge
                try:
                    response = await llm.ainvoke(conversation)
                    llm_text = response.content if hasattr(response, 'content') else str(response)
                    tool_name, tool_input = self._parse_action(llm_text)
                    if tool_name == "resolve_dispute" and tool_input:
                        tool_result = self._execute_tool(tool_name, tool_input)
                        await self._emit_trace(dispute_id, "tool_result", tool_result[:400])
                        final_output = tool_result
                    else:
                        final_output = llm_text
                except Exception as e:
                    logger.warning(f"Dispute nudge failed: {e}")

            # Final fallback
            if not final_output:
                final_output = self._auto_resolve(dispute_data)

            await self._emit_trace(dispute_id, "verdict", final_output[:500])

            # Parse action from output
            action = "escalated"
            output_upper = final_output.upper()
            if "APPROVE" in output_upper:
                action = "approved"
            elif "DENY" in output_upper or "DENIED" in output_upper:
                action = "denied"
            elif "ESCALATE" in output_upper:
                action = "escalated"

            return {
                "dispute_id": dispute_id,
                "action": action,
                "summary": final_output[:500],
            }

        except Exception as e:
            logger.error(f"Dispute investigation failed for {dispute_id}: {e}")
            await self._emit_trace(
                dispute_id, "verdict",
                f"Investigation error. Escalating for manual review. Error: {str(e)[:200]}"
            )
            return {
                "dispute_id": dispute_id,
                "action": "escalated",
                "summary": f"Investigation error: {str(e)[:200]}",
            }
