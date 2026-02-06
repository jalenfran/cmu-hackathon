"""Mock transaction generator + Kafka producer"""

import asyncio
import json
import random
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable, Awaitable

logger = logging.getLogger(__name__)

# Realistic merchant data
NORMAL_MERCHANTS = [
    {"name": "Starbucks", "id": "m001", "category": "Coffee", "city": "Pittsburgh", "country": "US", "lat": 40.4406, "lng": -79.9959},
    {"name": "Giant Eagle", "id": "m002", "category": "Grocery", "city": "Pittsburgh", "country": "US", "lat": 40.4523, "lng": -79.9327},
    {"name": "Shell Gas Station", "id": "m003", "category": "Gas", "city": "Pittsburgh", "country": "US", "lat": 40.4416, "lng": -79.9560},
    {"name": "Chipotle", "id": "m004", "category": "Restaurant", "city": "Pittsburgh", "country": "US", "lat": 40.4432, "lng": -79.9543},
    {"name": "Target", "id": "m005", "category": "Retail", "city": "Pittsburgh", "country": "US", "lat": 40.4601, "lng": -79.9230},
    {"name": "Uber", "id": "m006", "category": "Transport", "city": "Pittsburgh", "country": "US", "lat": 40.4406, "lng": -79.9959},
    {"name": "Amazon", "id": "m007", "category": "Online", "city": "Seattle", "country": "US", "lat": 47.6062, "lng": -122.3321},
    {"name": "Netflix", "id": "m008", "category": "Subscription", "city": "Los Gatos", "country": "US", "lat": 37.2358, "lng": -121.9624},
    {"name": "Walgreens", "id": "m009", "category": "Pharmacy", "city": "Pittsburgh", "country": "US", "lat": 40.4485, "lng": -79.9530},
    {"name": "PNC Park Concessions", "id": "m010", "category": "Entertainment", "city": "Pittsburgh", "country": "US", "lat": 40.4469, "lng": -80.0058},
    {"name": "Trader Joe's", "id": "m011", "category": "Grocery", "city": "Pittsburgh", "country": "US", "lat": 40.4527, "lng": -79.9350},
    {"name": "Carnegie Museum Gift Shop", "id": "m012", "category": "Retail", "city": "Pittsburgh", "country": "US", "lat": 40.4434, "lng": -79.9486},
]

ANOMALY_MERCHANTS = [
    {"name": "Luxury Watches Ltd", "id": "m100", "category": "Luxury", "city": "Bucharest", "country": "RO", "lat": 44.4268, "lng": 26.1025},
    {"name": "Gold Exchange", "id": "m101", "category": "Jewelry", "city": "Lagos", "country": "NG", "lat": 6.5244, "lng": 3.3792},
    {"name": "Electronics Mega Store", "id": "m102", "category": "Electronics", "city": "Shenzhen", "country": "CN", "lat": 22.5431, "lng": 114.0579},
    {"name": "Unknown Vendor #4891", "id": "m103", "category": "Unknown", "city": "Muscat", "country": "OM", "lat": 23.5880, "lng": 58.3829},
    {"name": "Crypto ATM Exchange", "id": "m104", "category": "Financial", "city": "Moscow", "country": "RU", "lat": 55.7558, "lng": 37.6173},
    {"name": "Premium Car Rental", "id": "m105", "category": "Transport", "city": "Dubai", "country": "AE", "lat": 25.2048, "lng": 55.2708},
]

ACCOUNT_IDS = [f"acc_{i:04d}" for i in range(1, 11)]

# Amount distributions
NORMAL_AMOUNT_RANGES = {
    "Coffee": (3.0, 8.0),
    "Grocery": (20.0, 150.0),
    "Gas": (25.0, 65.0),
    "Restaurant": (10.0, 50.0),
    "Retail": (15.0, 200.0),
    "Transport": (5.0, 35.0),
    "Online": (10.0, 100.0),
    "Subscription": (9.99, 19.99),
    "Pharmacy": (5.0, 80.0),
    "Entertainment": (8.0, 45.0),
}


def generate_normal_transaction() -> dict:
    merchant = random.choice(NORMAL_MERCHANTS)
    amount_range = NORMAL_AMOUNT_RANGES.get(merchant["category"], (5.0, 100.0))
    amount = round(random.uniform(*amount_range), 2)

    return {
        "id": str(uuid.uuid4())[:8],
        "account_id": random.choice(ACCOUNT_IDS),
        "merchant_name": merchant["name"],
        "merchant_id": merchant["id"],
        "amount": amount,
        "currency": "USD",
        "category": merchant["category"],
        "latitude": merchant["lat"] + random.uniform(-0.01, 0.01),
        "longitude": merchant["lng"] + random.uniform(-0.01, 0.01),
        "city": merchant["city"],
        "country": merchant["country"],
        "timestamp": datetime.utcnow().isoformat(),
        "risk_score": 0.0,
        "is_anomaly": False,
    }


def generate_anomaly_transaction() -> dict:
    merchant = random.choice(ANOMALY_MERCHANTS)
    anomaly_type = random.choice(["high_amount", "foreign", "rapid", "impossible_travel"])

    if anomaly_type == "high_amount":
        amount = round(random.uniform(2000, 15000), 2)
    elif anomaly_type == "foreign":
        amount = round(random.uniform(200, 5000), 2)
    elif anomaly_type == "rapid":
        amount = round(random.uniform(500, 3000), 2)
    else:  # impossible_travel
        amount = round(random.uniform(100, 8000), 2)

    return {
        "id": str(uuid.uuid4())[:8],
        "account_id": random.choice(ACCOUNT_IDS),
        "merchant_name": merchant["name"],
        "merchant_id": merchant["id"],
        "amount": amount,
        "currency": "USD",
        "category": merchant["category"],
        "latitude": merchant["lat"] + random.uniform(-0.01, 0.01),
        "longitude": merchant["lng"] + random.uniform(-0.01, 0.01),
        "city": merchant["city"],
        "country": merchant["country"],
        "timestamp": datetime.utcnow().isoformat(),
        "risk_score": 0.0,
        "is_anomaly": False,  # Will be set by anomaly engine
    }


# Pre-built dramatic fraud scenarios for demo injection
FRAUD_SCENARIOS = [
    {
        "name": "Impossible Travel - Bucharest",
        "transaction": {
            "merchant_name": "Luxury Watches Ltd",
            "merchant_id": "m100",
            "amount": 12450.00,
            "category": "Luxury",
            "city": "Bucharest",
            "country": "RO",
            "latitude": 44.4268,
            "longitude": 26.1025,
        }
    },
    {
        "name": "Rapid Fire - Lagos",
        "transaction": {
            "merchant_name": "Gold Exchange",
            "merchant_id": "m101",
            "amount": 8900.00,
            "category": "Jewelry",
            "city": "Lagos",
            "country": "NG",
            "latitude": 6.5244,
            "longitude": 3.3792,
        }
    },
    {
        "name": "Crypto Cash-Out - Moscow",
        "transaction": {
            "merchant_name": "Crypto ATM Exchange",
            "merchant_id": "m104",
            "amount": 14999.99,
            "category": "Financial",
            "city": "Moscow",
            "country": "RU",
            "latitude": 55.7558,
            "longitude": 37.6173,
        }
    },
]


class TransactionProducer:
    """Generates mock transactions and publishes to Kafka"""

    def __init__(self, bootstrap_servers: str, anomaly_probability: float = 0.08):
        self.bootstrap_servers = bootstrap_servers
        self.anomaly_probability = anomaly_probability
        self.producer = None
        self._running = False

    async def start(self):
        from aiokafka import AIOKafkaProducer
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await self.producer.start()
        self._running = True
        logger.info("Transaction producer started")

    async def stop(self):
        self._running = False
        if self.producer:
            await self.producer.stop()
        logger.info("Transaction producer stopped")

    def generate_transaction(self) -> dict:
        if random.random() < self.anomaly_probability:
            return generate_anomaly_transaction()
        return generate_normal_transaction()

    async def produce_loop(self, interval_min: float = 1.0, interval_max: float = 3.0):
        """Continuously generate and publish transactions"""
        while self._running:
            txn = self.generate_transaction()
            try:
                await self.producer.send_and_wait("transactions", txn)
                logger.debug(f"Produced transaction: {txn['id']} - {txn['merchant_name']} ${txn['amount']}")
            except Exception as e:
                logger.error(f"Failed to produce transaction: {e}")
            await asyncio.sleep(random.uniform(interval_min, interval_max))

    async def inject_fraud(self, scenario_index: int = 0) -> dict:
        """Inject a pre-built dramatic fraud scenario"""
        scenario = FRAUD_SCENARIOS[scenario_index % len(FRAUD_SCENARIOS)]
        txn = {
            "id": str(uuid.uuid4())[:8],
            "account_id": random.choice(ACCOUNT_IDS),
            **scenario["transaction"],
            "currency": "USD",
            "timestamp": datetime.utcnow().isoformat(),
            "risk_score": 0.0,
            "is_anomaly": False,
        }
        if self.producer:
            await self.producer.send_and_wait("transactions", txn)
        logger.info(f"Injected fraud scenario: {scenario['name']}")
        return txn
