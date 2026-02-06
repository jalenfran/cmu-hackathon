"""Pydantic models for API request/response serialization"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TransactionEvent(BaseModel):
    id: str
    account_id: str
    merchant_name: str
    merchant_id: str
    amount: float
    currency: str = "USD"
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    country: str = "US"
    timestamp: str
    risk_score: float = 0.0
    is_anomaly: bool = False


class AlertEvent(BaseModel):
    id: str
    transaction: TransactionEvent
    risk_score: float
    risk_factors: List[str]
    status: str = "pending"  # pending, investigating, blocked, cleared
    agent_verdict: Optional[str] = None
    timestamp: str


class AgentTrace(BaseModel):
    alert_id: str
    step_type: str  # thinking, tool_call, tool_result, action, verdict
    content: str
    timestamp: str


class DashboardStats(BaseModel):
    total_transactions: int = 0
    flagged_count: int = 0
    blocked_count: int = 0
    cleared_count: int = 0
    avg_risk_score: float = 0.0
    total_amount: float = 0.0


class WebSocketMessage(BaseModel):
    type: str  # transaction, alert, agent_trace, stats
    data: dict
