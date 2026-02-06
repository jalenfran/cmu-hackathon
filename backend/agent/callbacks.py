"""Custom LangChain callback handler for streaming agent traces to WebSocket"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Callable, Awaitable, Optional

from langchain_core.callbacks import BaseCallbackHandler

logger = logging.getLogger(__name__)


class AgentTraceCallback(BaseCallbackHandler):
    """Captures agent reasoning steps and broadcasts them via WebSocket"""

    def __init__(self, alert_id: str, broadcast_fn: Callable[[str, dict], Awaitable[None]]):
        self.alert_id = alert_id
        self.broadcast_fn = broadcast_fn
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def _get_loop(self):
        if self._loop is None:
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                self._loop = asyncio.get_event_loop()
        return self._loop

    def _emit(self, step_type: str, content: str):
        trace = {
            "alert_id": self.alert_id,
            "step_type": step_type,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            loop = self._get_loop()
            asyncio.ensure_future(self.broadcast_fn("agent_trace", trace), loop=loop)
        except Exception as e:
            logger.error(f"Failed to emit trace: {e}")

    def on_llm_start(self, serialized: dict, prompts: list, **kwargs):
        self._emit("thinking", "Analyzing the suspicious transaction...")

    def on_llm_new_token(self, token: str, **kwargs):
        pass  # We capture at higher granularity

    def on_llm_end(self, response: Any, **kwargs):
        text = ""
        try:
            text = response.generations[0][0].text[:300]
        except (IndexError, AttributeError):
            pass
        if text:
            self._emit("thinking", text)

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs):
        tool_name = serialized.get("name", "unknown_tool")
        self._emit("tool_call", f"Calling: {tool_name}({input_str[:200]})")

    def on_tool_end(self, output: str, **kwargs):
        self._emit("tool_result", output[:500])

    def on_agent_action(self, action: Any, **kwargs):
        self._emit("action", f"Decided to: {action.tool} with input: {str(action.tool_input)[:200]}")

    def on_agent_finish(self, finish: Any, **kwargs):
        output = finish.return_values.get("output", str(finish))
        self._emit("verdict", output[:500])
