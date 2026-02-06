"""FastAPI server - Central orchestration for Sentinel Mosaic"""

import asyncio
import logging
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.api.connection_manager import ConnectionManager
from backend.api.models import DashboardStats, TransactionEvent, AlertEvent
from backend.streaming.producer import TransactionProducer
from backend.streaming.consumer import TransactionConsumer
from backend.anomaly_detection.engine import AnomalyDetectionEngine
from backend.api.governance import router as governance_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
manager = ConnectionManager()
transaction_buffer = deque(maxlen=200)
alert_buffer = deque(maxlen=50)
stats = DashboardStats()
investigation_queue: asyncio.Queue = asyncio.Queue()
producer: TransactionProducer | None = None
anomaly_engine: AnomalyDetectionEngine | None = None


async def run_producer(prod: TransactionProducer):
    """Background task: generate and publish mock transactions"""
    try:
        await prod.start()
        interval_min = settings.demo_txn_interval if settings.demo_mode else settings.txn_interval_min
        interval_max = settings.demo_txn_interval if settings.demo_mode else settings.txn_interval_max
        await prod.produce_loop(interval_min, interval_max)
    except asyncio.CancelledError:
        await prod.stop()
    except Exception as e:
        logger.error(f"Producer error: {e}")
        await prod.stop()


async def run_consumer():
    """Background task: consume transactions, run anomaly detection, broadcast"""
    global stats
    consumer = TransactionConsumer(settings.kafka_bootstrap_servers, topic="transactions")
    try:
        await consumer.start()
        async for txn_data in consumer:
            txn = TransactionEvent(**txn_data)

            # Run anomaly detection
            if anomaly_engine:
                result = anomaly_engine.detect(txn_data)
                txn.risk_score = result.score
                txn.is_anomaly = result.is_anomaly

            # Update stats
            stats.total_transactions += 1
            stats.total_amount += txn.amount
            stats.avg_risk_score = (
                (stats.avg_risk_score * (stats.total_transactions - 1) + txn.risk_score)
                / stats.total_transactions
            )

            # Store in buffer
            transaction_buffer.appendleft(txn.model_dump())

            # Broadcast transaction to all WebSocket clients
            await manager.broadcast("transaction", txn.model_dump())

            # If anomaly, create alert and broadcast
            if txn.is_anomaly:
                alert = AlertEvent(
                    id=f"alert-{txn.id}",
                    transaction=txn,
                    risk_score=txn.risk_score,
                    risk_factors=result.risk_factors if anomaly_engine else [],
                    status="pending",
                    timestamp=datetime.utcnow().isoformat(),
                )
                stats.flagged_count += 1
                alert_buffer.appendleft(alert.model_dump())
                await manager.broadcast("alert", alert.model_dump())

                # Enqueue for agent investigation
                await investigation_queue.put(alert)

            # Broadcast updated stats
            await manager.broadcast("stats", stats.model_dump())

    except asyncio.CancelledError:
        await consumer.stop()
    except Exception as e:
        logger.error(f"Consumer error: {e}")
        await consumer.stop()


async def run_agent_worker():
    """Background task: investigate anomalies with AI agent"""
    try:
        from backend.agent.investigator import FraudInvestigatorAgent
        agent = FraudInvestigatorAgent(
            ollama_base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            broadcast_fn=manager.broadcast,
        )

        while True:
            alert = await investigation_queue.get()
            try:
                logger.info(f"Agent investigating alert: {alert.id}")
                await manager.broadcast("agent_trace", {
                    "alert_id": alert.id,
                    "step_type": "thinking",
                    "content": f"Investigating suspicious transaction: ${alert.transaction.amount:.2f} at {alert.transaction.merchant_name} in {alert.transaction.city}, {alert.transaction.country}",
                    "timestamp": datetime.utcnow().isoformat(),
                })
                verdict = await agent.investigate(alert.model_dump())

                # Update alert with verdict
                for stored_alert in alert_buffer:
                    if stored_alert["id"] == alert.id:
                        stored_alert["status"] = verdict.get("action", "flagged")
                        stored_alert["agent_verdict"] = verdict.get("summary", "")
                        break

                if verdict.get("action") == "blocked":
                    stats.blocked_count += 1
                elif verdict.get("action") == "cleared":
                    stats.cleared_count += 1

                await manager.broadcast("stats", stats.model_dump())
            except Exception as e:
                logger.error(f"Agent investigation failed: {e}")
                await manager.broadcast("agent_trace", {
                    "alert_id": alert.id,
                    "step_type": "verdict",
                    "content": f"Investigation error: {str(e)[:200]}. Alert flagged for manual review.",
                    "timestamp": datetime.utcnow().isoformat(),
                })
    except asyncio.CancelledError:
        pass
    except ImportError:
        logger.warning("Agent module not available, skipping agent worker")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global producer, anomaly_engine

    # Initialize anomaly detection
    anomaly_engine = AnomalyDetectionEngine()
    logger.info("Anomaly detection engine initialized")

    # Start producer
    producer = TransactionProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        anomaly_probability=settings.anomaly_probability,
    )

    # Launch background tasks
    tasks = [
        asyncio.create_task(run_producer(producer)),
        asyncio.create_task(run_consumer()),
        asyncio.create_task(run_agent_worker()),
    ]

    logger.info("Sentinel Mosaic backend started")
    yield

    # Shutdown
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    if producer:
        await producer.stop()
    logger.info("Sentinel Mosaic backend stopped")


app = FastAPI(title="Sentinel Mosaic API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(governance_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "sentinel-mosaic"}


@app.get("/api/transactions")
async def get_transactions(limit: int = 50):
    return list(transaction_buffer)[:limit]


@app.get("/api/alerts")
async def get_alerts(limit: int = 20):
    return list(alert_buffer)[:limit]


@app.get("/api/stats")
async def get_stats():
    return stats.model_dump()


@app.post("/api/demo/inject-fraud")
async def inject_fraud(scenario: int = 0):
    """Inject a dramatic fraud scenario for demo purposes"""
    if producer:
        txn = await producer.inject_fraud(scenario)
        return {"status": "injected", "transaction": txn}
    return {"status": "error", "message": "Producer not running"}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current stats on connect
        await websocket.send_json({"type": "stats", "data": stats.model_dump()})

        # Send recent transactions for context
        for txn in list(transaction_buffer)[:20]:
            await websocket.send_json({"type": "transaction", "data": txn})

        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
