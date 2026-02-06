"""Fraud Investigation Agent using LangChain + Ollama/Llama3"""

import logging
from datetime import datetime
from typing import Callable, Awaitable, Optional

from backend.agent.prompts import SYSTEM_PROMPT, INVESTIGATION_TEMPLATE
from backend.agent.tools import (
    check_account_history,
    verify_merchant,
    check_travel_feasibility,
    get_account_risk_profile,
    recommend_action,
)

logger = logging.getLogger(__name__)


class FraudInvestigatorAgent:
    """Autonomous AI agent that investigates fraud alerts"""

    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        model: str = "llama3:8b",
        broadcast_fn: Optional[Callable[[str, dict], Awaitable[None]]] = None,
    ):
        self.ollama_base_url = ollama_base_url
        self.model = model
        self.broadcast_fn = broadcast_fn
        self.tools = [
            check_account_history,
            verify_merchant,
            check_travel_feasibility,
            get_account_risk_profile,
            recommend_action,
        ]
        self._agent = None

    def _get_agent(self):
        """Lazy-initialize the LangGraph ReAct agent"""
        if self._agent is not None:
            return self._agent

        from langchain_ollama import ChatOllama
        from langgraph.prebuilt import create_react_agent

        llm = ChatOllama(
            base_url=self.ollama_base_url,
            model=self.model,
            temperature=0.1,
            num_predict=1024,
        )

        self._agent = create_react_agent(llm, self.tools)
        return self._agent

    async def _emit_trace(self, alert_id: str, step_type: str, content: str):
        """Broadcast an agent trace step via WebSocket"""
        if self.broadcast_fn:
            await self.broadcast_fn("agent_trace", {
                "alert_id": alert_id,
                "step_type": step_type,
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
            })

    async def investigate(self, alert_data: dict) -> dict:
        """Run a full fraud investigation on an alert"""
        alert_id = alert_data.get("id", "unknown")
        txn = alert_data.get("transaction", alert_data)

        # Build the investigation prompt
        risk_factors_str = "\n".join(
            f"  - {f}" for f in alert_data.get("risk_factors", ["Statistical anomaly detected"])
        )
        investigation_input = INVESTIGATION_TEMPLATE.format(
            alert_id=alert_id,
            transaction_id=txn.get("id", "unknown"),
            account_id=txn.get("account_id", "unknown"),
            merchant_name=txn.get("merchant_name", "Unknown"),
            merchant_id=txn.get("merchant_id", "unknown"),
            amount=txn.get("amount", 0),
            currency=txn.get("currency", "USD"),
            city=txn.get("city", "Unknown"),
            country=txn.get("country", "Unknown"),
            latitude=txn.get("latitude", 0),
            longitude=txn.get("longitude", 0),
            category=txn.get("category", "Unknown"),
            timestamp=txn.get("timestamp", ""),
            risk_score=txn.get("risk_score", 0),
            risk_factors=risk_factors_str,
        )

        try:
            agent = self._get_agent()

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": investigation_input},
            ]

            # Stream agent execution for real-time Brain Trace
            output = ""
            async for event in agent.astream_events(
                {"messages": messages},
                version="v2",
            ):
                kind = event.get("event", "")

                if kind == "on_chat_model_start":
                    await self._emit_trace(alert_id, "thinking", "Analyzing the suspicious transaction...")

                elif kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        output += chunk.content

                elif kind == "on_tool_start":
                    tool_name = event.get("name", "unknown")
                    tool_input = str(event.get("data", {}).get("input", ""))[:200]
                    await self._emit_trace(alert_id, "tool_call", f"Calling: {tool_name}({tool_input})")

                elif kind == "on_tool_end":
                    tool_output = str(event.get("data", {}).get("output", ""))[:500]
                    await self._emit_trace(alert_id, "tool_result", tool_output)

                elif kind == "on_chain_end":
                    # Capture the final output from the last chain end
                    chain_output = event.get("data", {}).get("output", {})
                    if isinstance(chain_output, dict) and "messages" in chain_output:
                        msgs = chain_output["messages"]
                        if msgs:
                            last_msg = msgs[-1]
                            if hasattr(last_msg, "content"):
                                output = last_msg.content

            # Emit final verdict
            if output:
                await self._emit_trace(alert_id, "verdict", output[:500])

            # Parse action from agent output
            action = "flagged"
            output_upper = output.upper()
            if "BLOCK" in output_upper:
                action = "blocked"
            elif "CLEAR" in output_upper:
                action = "cleared"
            elif "FLAG" in output_upper or "REVIEW" in output_upper:
                action = "flagged"

            return {
                "alert_id": alert_id,
                "action": action,
                "summary": output[:500],
                "raw_output": output,
            }
        except Exception as e:
            logger.error(f"Investigation failed for {alert_id}: {e}")
            await self._emit_trace(
                alert_id, "verdict",
                f"Investigation encountered an error. Flagging for manual review. Error: {str(e)[:200]}"
            )
            return {
                "alert_id": alert_id,
                "action": "flagged",
                "summary": f"Investigation error: {str(e)[:200]}",
            }
