"""Transaction producer - creates real purchases via Nessie API and publishes to Kafka"""

import asyncio
import json
import random
import uuid
import logging
from datetime import datetime
from typing import Optional, List

from backend.nessie_client.client import NessieClient
from backend.api.models import DisputeEvent

logger = logging.getLogger(__name__)

# Amount distributions by category (used when generating purchase amounts)
AMOUNT_RANGES = {
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
    "food": (5.0, 80.0),
    "Food": (5.0, 80.0),
    "cafe": (3.0, 15.0),
    "store": (10.0, 150.0),
    "tech": (50.0, 500.0),
    "Tech": (50.0, 500.0),
    "Clothing": (20.0, 200.0),
    "Health": (15.0, 100.0),
    "Lodging": (80.0, 300.0),
    "furniture_store": (50.0, 500.0),
    "bar": (8.0, 40.0),
    "restaurant": (10.0, 50.0),
    "meal_takeaway": (8.0, 35.0),
    "department_store": (15.0, 200.0),
    "hardware_store": (10.0, 150.0),
    "book_store": (5.0, 40.0),
    "car_dealer": (100.0, 500.0),
    "car_repair": (50.0, 300.0),
    "natural_feature": (10.0, 50.0),
    "Gambling": (50.0, 5000.0),
}

# Suspicious merchants for anomaly injection (not in Nessie - simulated fraud)
ANOMALY_MERCHANTS = [
    {"name": "Luxury Watches Ltd", "id": "m100", "category": "Luxury", "city": "Bucharest", "country": "RO", "lat": 44.4268, "lng": 26.1025},
    {"name": "Gold Exchange", "id": "m101", "category": "Jewelry", "city": "Lagos", "country": "NG", "lat": 6.5244, "lng": 3.3792},
    {"name": "Electronics Mega Store", "id": "m102", "category": "Electronics", "city": "Shenzhen", "country": "CN", "lat": 22.5431, "lng": 114.0579},
    {"name": "Unknown Vendor #4891", "id": "m103", "category": "Unknown", "city": "Muscat", "country": "OM", "lat": 23.5880, "lng": 58.3829},
    {"name": "Crypto ATM Exchange", "id": "m104", "category": "Financial", "city": "Moscow", "country": "RU", "lat": 55.7558, "lng": 37.6173},
    {"name": "Premium Car Rental", "id": "m105", "category": "Transport", "city": "Dubai", "country": "AE", "lat": 25.2048, "lng": 55.2708},
    {"name": "FastCash Wire Services", "id": "m106", "category": "Financial", "city": "George Town", "country": "KY", "lat": 19.2869, "lng": -81.3674},
    {"name": "Online Casino Palace", "id": "m107", "category": "Gambling", "city": "Valletta", "country": "MT", "lat": 35.8989, "lng": 14.5146},
    {"name": "Shell Corp Trading", "id": "m108", "category": "Unknown", "city": "Panama City", "country": "PA", "lat": 8.9824, "lng": -79.5199},
]

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
    {
        "name": "Identity Theft - Card Not Present",
        "transaction": {
            "merchant_name": "Online Casino Palace",
            "merchant_id": "m107",
            "amount": 4750.00,
            "category": "Gambling",
            "city": "Valletta",
            "country": "MT",
            "latitude": 35.8989,
            "longitude": 14.5146,
        }
    },
    {
        "name": "Mule Account - Structuring",
        "transaction": {
            "merchant_name": "FastCash Wire Services",
            "merchant_id": "m106",
            "amount": 9999.00,
            "category": "Financial",
            "city": "George Town",
            "country": "KY",
            "latitude": 19.2869,
            "longitude": -81.3674,
        }
    },
    {
        "name": "Account Takeover - Wire",
        "transaction": {
            "merchant_name": "Shell Corp Trading",
            "merchant_id": "m108",
            "amount": 24500.00,
            "category": "Unknown",
            "city": "Panama City",
            "country": "PA",
            "latitude": 8.9824,
            "longitude": -79.5199,
        }
    },
    {
        "name": "Phantom Merchant",
        "transaction": {
            "merchant_name": "Unknown Vendor #4891",
            "merchant_id": "m103",
            "amount": 6200.00,
            "category": "Unknown",
            "city": "Muscat",
            "country": "OM",
            "latitude": 23.5880,
            "longitude": 58.3829,
        }
    },
]

# These get populated from Nessie on startup
ACCOUNT_IDS: List[str] = [f"acc_{i:04d}" for i in range(1, 21)]
NESSIE_MERCHANTS: List[dict] = []
_nessie_client: Optional[NessieClient] = None

# Dispute generation
DISPUTE_REASONS = [
    "unauthorized_charge",
    "wrong_amount",
    "never_received",
    "duplicate",
    "fraud_claim",
]

CUSTOMER_STATEMENTS = {
    "unauthorized_charge": [
        "I did not authorize this transaction. Someone may have stolen my card information.",
        "I don't recognize this charge on my account. I was not in that location.",
        "This purchase was not made by me. I still have my card in my possession.",
    ],
    "wrong_amount": [
        "I was charged ${amount:.2f} but the receipt shows a different amount.",
        "The merchant charged me more than the agreed price.",
        "This amount is incorrect. The actual purchase was much less than ${amount:.2f}.",
    ],
    "never_received": [
        "I was charged but never received the goods or service from {merchant}.",
        "The merchant {merchant} took my payment but did not deliver the product.",
        "I paid ${amount:.2f} to {merchant} but my order was never fulfilled.",
    ],
    "duplicate": [
        "I see this charge twice on my statement. This appears to be a duplicate.",
        "I was double-charged by {merchant} for the same transaction.",
        "This is a duplicate charge. I only made one purchase at {merchant}.",
    ],
    "fraud_claim": [
        "I believe my account has been compromised. This transaction is fraudulent.",
        "I suspect identity theft. Multiple unauthorized charges appeared on my account.",
        "This transaction is part of a fraud pattern I've noticed on my account.",
    ],
}


def generate_dispute(txn_data: dict) -> dict:
    """Generate a random dispute for a transaction"""
    reason = random.choice(DISPUTE_REASONS)
    templates = CUSTOMER_STATEMENTS.get(reason, CUSTOMER_STATEMENTS["unauthorized_charge"])
    statement = random.choice(templates).format(
        amount=txn_data.get("amount", 0),
        merchant=txn_data.get("merchant_name", "the merchant"),
    )

    return DisputeEvent(
        id=f"dispute-{str(uuid.uuid4())[:8]}",
        transaction_id=txn_data.get("id", "unknown"),
        account_id=txn_data.get("account_id", "unknown"),
        amount=txn_data.get("amount", 0),
        merchant_name=txn_data.get("merchant_name", "Unknown"),
        reason=reason,
        customer_statement=statement,
        status="pending",
        timestamp=datetime.utcnow().isoformat(),
    ).model_dump()


def load_nessie_merchants(merchants: list):
    """Store real Nessie merchants for transaction generation"""
    if not merchants:
        return

    for m in merchants:
        geocode = m.get("geocode", {})
        address = m.get("address", {})
        categories = m.get("category", [])
        cat = categories[0] if isinstance(categories, list) and categories else (
            categories if isinstance(categories, str) else "Retail"
        )

        NESSIE_MERCHANTS.append({
            "name": m.get("name", "Unknown Merchant"),
            "id": m.get("_id", "unknown"),
            "category": cat,
            "city": address.get("city", "Unknown"),
            "state": address.get("state", "US"),
            "lat": geocode.get("lat", 40.44) if geocode else 40.44,
            "lng": geocode.get("lng", -79.99) if geocode else -79.99,
        })

    logger.info(f"Producer: loaded {len(NESSIE_MERCHANTS)} Nessie merchants")


def set_nessie_client(client: NessieClient):
    """Set the Nessie client for creating real purchases"""
    global _nessie_client
    _nessie_client = client
    logger.info("Producer: Nessie client connected - will create real purchases")


def _get_amount_for_category(category: str) -> float:
    """Get a realistic random amount for a merchant category with natural variance.

    Uses a skewed distribution instead of uniform so most purchases are
    near the low end with occasional higher-value purchases.
    """
    lo, hi = AMOUNT_RANGES.get(category, (5.0, 100.0))
    # Triangular distribution: mode at 30% of range (most purchases are smaller)
    mode = lo + (hi - lo) * 0.3
    return round(random.triangular(lo, hi, mode), 2)


def _get_anomaly_amount() -> float:
    """Get a stochastic anomaly amount — some subtle, some extreme.

    Uses a lognormal distribution so amounts range from borderline-normal
    ($150) to clearly suspicious ($15K), with most landing in $300-$3000.
    """
    # Lognormal: median ~$800, long tail to $15K, floor at $150
    amount = random.lognormvariate(mu=6.7, sigma=0.9)  # median ≈ $812
    amount = max(150, min(15000, amount))
    return round(amount, 2)


class TransactionProducer:
    """Creates real purchases via Nessie API and publishes to Kafka for processing"""

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
        mode = "Nessie API (real purchases)" if _nessie_client and NESSIE_MERCHANTS else "mock"
        logger.info(f"Transaction producer started (mode: {mode})")

    async def stop(self):
        self._running = False
        if self.producer:
            await self.producer.stop()
        logger.info("Transaction producer stopped")

    async def _create_nessie_purchase(self, account_id: str, merchant: dict, amount: float) -> dict:
        """Create a real purchase in Nessie and return the transaction dict"""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        purchase = await _nessie_client.create_purchase(
            account_id=account_id,
            merchant_id=merchant["id"],
            amount=amount,
            purchase_date=today,
            description=f"{merchant['name']} - {merchant['category']}",
        )

        nessie_id = purchase.get("_id", str(uuid.uuid4())[:8]) if purchase else str(uuid.uuid4())[:8]

        return {
            "id": nessie_id,
            "account_id": account_id,
            "merchant_name": merchant["name"],
            "merchant_id": merchant["id"],
            "amount": amount,
            "currency": "USD",
            "category": merchant["category"],
            "latitude": merchant.get("lat", 40.44) + random.uniform(-0.005, 0.005),
            "longitude": merchant.get("lng", -79.99) + random.uniform(-0.005, 0.005),
            "city": merchant.get("city", "Unknown"),
            "country": "US",
            "timestamp": datetime.utcnow().isoformat(),
            "risk_score": 0.0,
            "is_anomaly": False,
            "nessie_purchase_id": nessie_id,
        }

    async def generate_transaction(self) -> dict:
        """Generate a transaction - creates a real Nessie purchase when connected.

        ~8% true anomalies (foreign suspicious merchants),
        ~12% elevated normals (higher-than-usual domestic purchases) for realistic variance.
        """
        roll = random.random()
        is_anomaly = roll < self.anomaly_probability
        is_elevated = not is_anomaly and roll < (self.anomaly_probability + 0.12)

        if is_elevated and NESSIE_MERCHANTS:
            # Elevated normal: a legitimate domestic merchant but with a higher-than-usual amount
            merchant = random.choice(NESSIE_MERCHANTS)
            base_amount = _get_amount_for_category(merchant.get("category", "Retail"))
            # 2x-5x the normal range — suspicious but plausible
            amount = round(base_amount * random.uniform(2.0, 5.0), 2)
            account_id = random.choice(ACCOUNT_IDS)
            if _nessie_client:
                try:
                    return await self._create_nessie_purchase(account_id, merchant, amount)
                except Exception:
                    pass
            return {
                "id": str(uuid.uuid4())[:8],
                "account_id": account_id,
                "merchant_name": merchant["name"],
                "merchant_id": merchant["id"],
                "amount": amount,
                "currency": "USD",
                "category": merchant.get("category", "Retail"),
                "latitude": merchant.get("lat", 40.44) + random.uniform(-0.01, 0.01),
                "longitude": merchant.get("lng", -79.99) + random.uniform(-0.01, 0.01),
                "city": merchant.get("city", "Unknown"),
                "country": "US",
                "timestamp": datetime.utcnow().isoformat(),
                "risk_score": 0.0,
                "is_anomaly": False,
            }

        if is_anomaly:
            # Anomaly transactions use fake foreign merchants (not in Nessie)
            merchant = random.choice(ANOMALY_MERCHANTS)
            amount = _get_anomaly_amount()
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

        # Normal transaction - use Nessie if available
        if _nessie_client and NESSIE_MERCHANTS:
            merchant = random.choice(NESSIE_MERCHANTS)
            amount = _get_amount_for_category(merchant["category"])
            account_id = random.choice(ACCOUNT_IDS)
            try:
                return await self._create_nessie_purchase(account_id, merchant, amount)
            except Exception as e:
                logger.warning(f"Nessie purchase failed, using local: {e}")

        # Fallback: generate locally without Nessie
        merchant = random.choice(NESSIE_MERCHANTS) if NESSIE_MERCHANTS else random.choice(ANOMALY_MERCHANTS)
        amount = _get_amount_for_category(merchant.get("category", "Retail"))
        return {
            "id": str(uuid.uuid4())[:8],
            "account_id": random.choice(ACCOUNT_IDS),
            "merchant_name": merchant["name"],
            "merchant_id": merchant["id"],
            "amount": amount,
            "currency": "USD",
            "category": merchant.get("category", "Retail"),
            "latitude": merchant.get("lat", 40.44) + random.uniform(-0.01, 0.01),
            "longitude": merchant.get("lng", -79.99) + random.uniform(-0.01, 0.01),
            "city": merchant.get("city", "Unknown"),
            "country": merchant.get("country", "US"),
            "timestamp": datetime.utcnow().isoformat(),
            "risk_score": 0.0,
            "is_anomaly": False,
        }

    async def produce_loop(self, interval_min: float = 1.0, interval_max: float = 3.0):
        """Continuously generate and publish transactions"""
        while self._running:
            try:
                txn = await self.generate_transaction()
                await self.producer.send_and_wait("transactions", txn)
                source = "Nessie" if txn.get("nessie_purchase_id") else "local"
                logger.debug(f"Produced [{source}]: {txn['id']} - {txn['merchant_name']} ${txn['amount']}")
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
