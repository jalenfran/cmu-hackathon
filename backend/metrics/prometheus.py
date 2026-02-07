"""Prometheus metric definitions for Aegis fraud detection platform.

Exports application-level metrics for real-time monitoring via Grafana.
Uses prometheus_client's multi-process safe counters, histograms, and gauges.
"""

from prometheus_client import Counter, Histogram, Gauge, make_asgi_app

# --- Transaction Pipeline ---

TRANSACTIONS_TOTAL = Counter(
    "aegis_transactions_processed_total",
    "Total transactions processed by the anomaly detection pipeline",
    ["status"],  # normal, anomaly
)

RISK_SCORE_DISTRIBUTION = Histogram(
    "aegis_risk_score_distribution",
    "Distribution of transaction risk scores (0.0 = safe, 1.0 = fraud)",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9, 1.0],
)

FAISS_NOVELTY_BOOST_TOTAL = Counter(
    "aegis_faiss_novelty_boost_total",
    "Times FAISS vector similarity boosted a transaction risk score to anomaly threshold",
)

# --- Agent Investigations ---

INVESTIGATIONS_TOTAL = Counter(
    "aegis_investigations_total",
    "Total fraud investigations completed by AI agent",
    ["verdict"],  # blocked, cleared, flagged
)

INVESTIGATION_DURATION = Histogram(
    "aegis_investigation_duration_seconds",
    "Time spent on AI agent fraud investigations",
    buckets=[1, 2, 5, 10, 30, 60, 120, 300],
)

# --- Disputes ---

DISPUTES_TOTAL = Counter(
    "aegis_disputes_total",
    "Total customer disputes processed",
    ["action"],  # approved, denied, escalated
)

# --- Business Metrics ---

MONEY_SAVED = Gauge(
    "aegis_money_saved_usd",
    "Total money saved by blocking fraudulent transactions (USD)",
)

# --- Infrastructure ---

ACTIVE_WS_CONNECTIONS = Gauge(
    "aegis_active_websocket_connections",
    "Number of active WebSocket connections to the dashboard",
)


def create_metrics_app():
    """Create ASGI sub-application for serving /metrics endpoint.

    Mount this on FastAPI via: app.mount("/metrics", create_metrics_app())
    Prometheus scrapes this endpoint for metric collection.
    """
    return make_asgi_app()
