"""FastAPI server - Central orchestration for Aegis"""

import asyncio
import random
import logging
import traceback
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.api.connection_manager import ConnectionManager
from backend.api.models import DashboardStats, TransactionEvent, AlertEvent
from backend.streaming.producer import TransactionProducer, generate_dispute
from backend.streaming.consumer import TransactionConsumer
from backend.anomaly_detection.engine import AnomalyDetectionEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
manager = ConnectionManager()
transaction_buffer = deque(maxlen=200)
alert_buffer = deque(maxlen=50)
dispute_buffer = deque(maxlen=100)
stats = DashboardStats()
investigation_queue: asyncio.Queue = asyncio.Queue()
dispute_queue: asyncio.Queue = asyncio.Queue()
producer: TransactionProducer | None = None
anomaly_engine: AnomalyDetectionEngine | None = None
nessie_client = None


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
        logger.error(f"Producer error: {e}\n{traceback.format_exc()}")
        await prod.stop()


async def run_consumer():
    """Background task: consume transactions, run anomaly detection, broadcast, generate disputes"""
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
            txn_dict = txn.model_dump()
            transaction_buffer.appendleft(txn_dict)

            # Broadcast transaction to all WebSocket clients
            await manager.broadcast("transaction", txn_dict)

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

            # Random dispute generation (only for non-anomaly transactions)
            elif random.random() < settings.dispute_probability:
                dispute = generate_dispute(txn_dict)
                dispute_buffer.appendleft(dispute)
                stats.disputes_filed += 1
                await manager.broadcast("dispute", dispute)
                await dispute_queue.put(dispute)
                logger.info(f"Dispute filed: {dispute['id']} - {dispute['reason']} for ${dispute['amount']:.2f}")

            # Broadcast updated stats
            await manager.broadcast("stats", stats.model_dump())

    except asyncio.CancelledError:
        await consumer.stop()
    except Exception as e:
        logger.error(f"Consumer error: {e}\n{traceback.format_exc()}")
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
                verdict = await agent.investigate(alert.model_dump())

                # Update alert with verdict and broadcast
                for stored_alert in alert_buffer:
                    if stored_alert["id"] == alert.id:
                        stored_alert["status"] = verdict.get("action", "flagged")
                        stored_alert["agent_verdict"] = verdict.get("summary", "")
                        await manager.broadcast("alert_update", stored_alert)
                        break

                if verdict.get("action") == "blocked":
                    stats.blocked_count += 1
                    stats.money_saved += alert.transaction.amount
                elif verdict.get("action") == "cleared":
                    stats.cleared_count += 1

                stats.investigations_completed += 1
                await manager.broadcast("stats", stats.model_dump())
            except Exception as e:
                logger.error(f"Agent investigation failed: {e}\n{traceback.format_exc()}")
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


async def run_account_grower():
    """Background task: periodically create new Nessie customers/accounts so the pool grows"""
    if not nessie_client:
        logger.info("Account grower: no Nessie client, skipping")
        return

    from backend.nessie_client.seeder import _create_customer, _create_account
    from backend.streaming import producer as prod_module
    from backend.kyc.engine import set_account_customer_mapping

    # Pool of names to create accounts for over time
    new_customers = [
        {"first_name": "James", "last_name": "Taylor"},
        {"first_name": "Sophia", "last_name": "Nguyen"},
        {"first_name": "Marcus", "last_name": "Brown"},
        {"first_name": "Priya", "last_name": "Sharma"},
        {"first_name": "Liam", "last_name": "O'Connor"},
        {"first_name": "Mei", "last_name": "Zhang"},
        {"first_name": "Carlos", "last_name": "Garcia"},
        {"first_name": "Aisha", "last_name": "Mohammed"},
        {"first_name": "Ryan", "last_name": "Murphy"},
        {"first_name": "Yuki", "last_name": "Tanaka"},
    ]

    idx = 0
    # Wait a bit before starting, let the system warm up
    await asyncio.sleep(30)

    while idx < len(new_customers):
        try:
            info = new_customers[idx]
            customer_id = await _create_customer(nessie_client, info)
            if customer_id:
                # Create a checking account
                account = await _create_account(nessie_client, customer_id, "Checking", round(random.uniform(2000, 15000), 2))
                if account:
                    prod_module.ACCOUNT_IDS.append(account.id)
                    set_account_customer_mapping(account.id, customer_id)
                    logger.info(f"Account grower: added {info['first_name']} {info['last_name']} -> {account.id}")

                # ~40% chance of also creating a savings account
                if random.random() < 0.4:
                    account2 = await _create_account(nessie_client, customer_id, "Savings", round(random.uniform(5000, 30000), 2))
                    if account2:
                        prod_module.ACCOUNT_IDS.append(account2.id)
                        set_account_customer_mapping(account2.id, customer_id)

            idx += 1
        except Exception as e:
            logger.warning(f"Account grower: failed to create customer: {e}")
            idx += 1

        # Wait 45-90 seconds between new customers for a natural growth pace
        await asyncio.sleep(random.uniform(45, 90))

    logger.info(f"Account grower: finished, {len(prod_module.ACCOUNT_IDS)} total accounts in pool")


async def run_dispute_worker():
    """Background task: investigate customer disputes with AI agent"""
    try:
        from backend.agent.dispute_agent import DisputeInvestigatorAgent
        from backend.agent.dispute_tools import set_dispute_buffers, record_dispute_outcome

        # Wire buffers into dispute tools for context lookups
        set_dispute_buffers(alert_buffer, transaction_buffer)

        agent = DisputeInvestigatorAgent(
            ollama_base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            broadcast_fn=manager.broadcast,
        )

        while True:
            dispute = await dispute_queue.get()
            try:
                dispute_id = dispute["id"]
                logger.info(f"Dispute agent investigating: {dispute_id}")

                # Update status to investigating
                for stored in dispute_buffer:
                    if stored["id"] == dispute_id:
                        stored["status"] = "investigating"
                        await manager.broadcast("dispute_update", stored)
                        break

                # Run investigation
                result = await agent.investigate(dispute)

                # Update dispute with resolution
                action = result.get("action", "escalated")
                for stored in dispute_buffer:
                    if stored["id"] == dispute_id:
                        stored["status"] = action
                        stored["agent_resolution"] = action
                        stored["resolution_summary"] = result.get("summary", "")[:300]
                        stored["resolved_at"] = datetime.utcnow().isoformat()
                        await manager.broadcast("dispute_update", stored)
                        break

                # Update stats
                if action == "approved":
                    stats.disputes_approved += 1
                elif action == "denied":
                    stats.disputes_denied += 1

                # Record for history tracking
                record_dispute_outcome(dispute["account_id"], {
                    "reason": dispute["reason"],
                    "amount": dispute["amount"],
                    "action": action.upper(),
                })

                await manager.broadcast("stats", stats.model_dump())
                logger.info(f"Dispute {dispute_id} resolved: {action}")

            except Exception as e:
                logger.error(f"Dispute investigation failed: {e}\n{traceback.format_exc()}")
                # Mark as escalated on error
                for stored in dispute_buffer:
                    if stored["id"] == dispute.get("id"):
                        stored["status"] = "escalated"
                        stored["resolution_summary"] = f"Error: {str(e)[:200]}"
                        stored["resolved_at"] = datetime.utcnow().isoformat()
                        await manager.broadcast("dispute_update", stored)
                        break
    except asyncio.CancelledError:
        pass
    except ImportError as e:
        logger.warning(f"Dispute agent module not available: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global producer, anomaly_engine, nessie_client

    # Initialize anomaly detection
    anomaly_engine = AnomalyDetectionEngine()
    logger.info("Anomaly detection engine initialized")

    # Initialize Nessie API if key is configured
    if settings.nessie_api_key and settings.nessie_api_key != "your_key_here":
        try:
            from backend.nessie_client.client import NessieClient
            from backend.nessie_client.seeder import seed_nessie_data
            nessie_client = NessieClient(api_key=settings.nessie_api_key)
            nessie_data = await seed_nessie_data(nessie_client)

            # Wire Nessie account IDs into the producer
            from backend.streaming import producer as prod_module
            if nessie_data.get("account_ids"):
                prod_module.ACCOUNT_IDS[:] = nessie_data["account_ids"]
                logger.info(f"Nessie API seeded: {len(nessie_data['account_ids'])} accounts loaded")

            # Wire Nessie merchants into the producer
            if nessie_data.get("merchants"):
                prod_module.load_nessie_merchants(nessie_data["merchants"])

            # Wire Nessie client into producer (for creating real purchases)
            prod_module.set_nessie_client(nessie_client)

            # Wire Nessie client into agent tools
            from backend.agent import tools as agent_tools
            agent_tools.set_nessie_client(nessie_client)
        except Exception as e:
            logger.warning(f"Nessie API initialization failed (using mock data): {e}")
            nessie_client = None
    else:
        logger.info("No Nessie API key configured, using mock data")

    # Start producer
    producer = TransactionProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        anomaly_probability=settings.anomaly_probability,
    )

    # Launch background tasks (3 parallel agent workers for concurrent investigations)
    tasks = [
        asyncio.create_task(run_producer(producer)),
        asyncio.create_task(run_consumer()),
        asyncio.create_task(run_agent_worker()),
        asyncio.create_task(run_agent_worker()),
        asyncio.create_task(run_agent_worker()),
        asyncio.create_task(run_dispute_worker()),
        asyncio.create_task(run_account_grower()),
    ]

    logger.info("Aegis backend started")
    yield

    # Shutdown
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    if producer:
        await producer.stop()
    if nessie_client:
        await nessie_client.close()
    logger.info("Aegis backend stopped")


app = FastAPI(title="Aegis API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "aegis",
        "nessie_connected": nessie_client is not None,
        "anomaly_engine": anomaly_engine is not None,
        "producer_active": producer is not None,
    }


@app.get("/api/transactions")
async def get_transactions(limit: int = 50):
    return list(transaction_buffer)[:limit]


@app.get("/api/alerts")
async def get_alerts(limit: int = 20):
    return list(alert_buffer)[:limit]


@app.get("/api/disputes")
async def get_disputes(limit: int = 20):
    return list(dispute_buffer)[:limit]


@app.get("/api/stats")
async def get_stats():
    return stats.model_dump()


@app.get("/api/kyc/{account_id}")
async def get_kyc(account_id: str):
    """Run KYC risk assessment for an account"""
    from backend.kyc.engine import kyc_engine
    from backend.agent.tools import _account_histories
    history = _account_histories.get(account_id, [])
    result = kyc_engine.assess(account_id, history)
    return result


@app.post("/api/demo/inject-fraud")
async def inject_fraud(scenario: int = 0):
    """Inject a dramatic fraud scenario for demo purposes"""
    if producer:
        txn = await producer.inject_fraud(scenario)
        return {"status": "injected", "transaction": txn}
    return {"status": "error", "message": "Producer not running"}


@app.post("/api/demo/inject-dispute")
async def inject_dispute():
    """Manually trigger a dispute on a recent transaction for demo"""
    if not transaction_buffer:
        return {"status": "error", "message": "No transactions available"}

    # Pick a random recent non-anomaly transaction
    candidates = [t for t in list(transaction_buffer)[:20] if not t.get("is_anomaly")]
    if not candidates:
        candidates = list(transaction_buffer)[:5]

    txn = random.choice(candidates)
    dispute = generate_dispute(txn)
    dispute_buffer.appendleft(dispute)
    stats.disputes_filed += 1
    await manager.broadcast("dispute", dispute)
    await dispute_queue.put(dispute)
    await manager.broadcast("stats", stats.model_dump())

    return {"status": "injected", "dispute": dispute}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current state snapshot on connect (backfill)
        await websocket.send_json({"type": "stats", "data": stats.model_dump()})
        await websocket.send_json({
            "type": "backfill",
            "data": {
                "transactions": list(transaction_buffer)[:20],
                "alerts": list(alert_buffer)[:10],
                "disputes": list(dispute_buffer)[:10],
            },
        })

        # Keep connection alive - handle pings and any client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Client can send "ping" to keep alive
                if data == "ping":
                    await websocket.send_json({"type": "pong", "data": {}})
            except asyncio.TimeoutError:
                # Send keepalive ping from server side
                await websocket.send_json({"type": "ping", "data": {}})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
