"""LangChain tools for the fraud investigation agent"""

import random
import logging
from datetime import datetime, timedelta
from langchain_core.tools import tool

from backend.anomaly_detection.features import haversine

logger = logging.getLogger(__name__)

# In-memory data store for tool responses (populated by the producer or Nessie)
_account_histories = {}
_merchant_data = {}
_nessie_client = None


def set_account_history(account_id: str, transactions: list):
    _account_histories[account_id] = transactions


def set_merchant_data(merchant_id: str, data: dict):
    _merchant_data[merchant_id] = data


def set_nessie_client(client):
    """Set the Nessie API client for real-time data lookups"""
    global _nessie_client
    _nessie_client = client


@tool
def check_account_history(account_id: str) -> str:
    """Check the recent transaction history for a bank account. Returns the last 20 transactions."""
    history = _account_histories.get(account_id, [])
    if not history:
        # Generate realistic mock history as fallback
        history = _generate_mock_history(account_id)

    source = "Nessie API" if account_id in _account_histories and _nessie_client else "simulated"
    recent = history[-20:]
    lines = [f"Recent transactions for account {account_id} ({len(recent)} shown, source: {source}):"]
    total = 0.0
    for txn in recent:
        total += txn.get("amount", 0)
        lines.append(
            f"  - {txn.get('timestamp', 'N/A')[:16]} | "
            f"${txn.get('amount', 0):.2f} | "
            f"{txn.get('merchant_name', 'Unknown')} | "
            f"{txn.get('city', 'Unknown')}, {txn.get('country', 'US')}"
        )
    lines.append(f"\nAverage transaction: ${total / max(len(recent), 1):.2f}")
    lines.append(f"Total in period: ${total:.2f}")
    return "\n".join(lines)


@tool
def verify_merchant(merchant_id: str) -> str:
    """Verify a merchant's legitimacy and business details. Returns merchant information."""
    data = _merchant_data.get(merchant_id)
    if not data:
        data = _generate_mock_merchant(merchant_id)

    source = "Nessie API" if merchant_id in _merchant_data and _nessie_client else "simulated"
    lines = [f"Merchant Verification Report for {merchant_id} (source: {source}):"]
    lines.append(f"  Name: {data.get('name', 'Unknown')}")
    lines.append(f"  Category: {data.get('category', 'Unknown')}")
    lines.append(f"  Location: {data.get('city', 'Unknown')}, {data.get('country', 'Unknown')}")
    lines.append(f"  Registration Status: {data.get('registration', 'Not Found')}")
    lines.append(f"  Years in Business: {data.get('years', 'Unknown')}")
    lines.append(f"  Fraud Reports: {data.get('fraud_reports', 0)}")
    lines.append(f"  Trust Score: {data.get('trust_score', 'N/A')}/100")
    return "\n".join(lines)


@tool
def check_travel_feasibility(
    lat1: float, lon1: float, lat2: float, lon2: float, time_gap_minutes: float
) -> str:
    """Check if travel between two locations is physically possible given the time gap.
    Provide coordinates of both locations and the time difference in minutes."""
    distance_km = haversine(lat1, lon1, lat2, lon2)
    if time_gap_minutes <= 0:
        time_gap_minutes = 1

    required_speed_kmh = distance_km / (time_gap_minutes / 60)

    result = [f"Travel Feasibility Analysis:"]
    result.append(f"  Distance: {distance_km:.1f} km")
    result.append(f"  Time gap: {time_gap_minutes:.0f} minutes")
    result.append(f"  Required speed: {required_speed_kmh:.0f} km/h")

    if required_speed_kmh > 900:
        result.append(f"  Verdict: IMPOSSIBLE - Would require faster than commercial flight speed")
        result.append(f"  Max feasible with flight: ~900 km/h")
    elif required_speed_kmh > 300:
        result.append(f"  Verdict: HIGHLY UNLIKELY - Would require high-speed transport with no delays")
    elif required_speed_kmh > 120:
        result.append(f"  Verdict: UNLIKELY - Would require sustained highway speed with no stops")
    else:
        result.append(f"  Verdict: FEASIBLE - Normal travel speed")

    return "\n".join(result)


@tool
def get_account_risk_profile(account_id: str) -> str:
    """Get the overall risk profile and statistics for a bank account."""
    history = _account_histories.get(account_id, [])

    if history:
        # Calculate real stats from actual transaction history
        amounts = [t.get("amount", 0) for t in history]
        countries = [t.get("country", "US") for t in history]
        international_count = sum(1 for c in countries if c != "US")
        international_pct = round(international_count / max(len(countries), 1) * 100, 1)

        # Gather unique locations
        locations = list(set(
            f"{t.get('city', 'Unknown')}, {t.get('country', 'US')}"
            for t in history[-20:]
        ))

        # Count previous anomalies
        anomaly_count = sum(
            1 for t in history
            if t.get("is_anomaly", False) or t.get("risk_score", 0) > 0.5
        )

        # Determine risk tier based on data
        if anomaly_count > 2 or international_pct > 30:
            risk_tier = "High"
        elif anomaly_count > 0 or international_pct > 15:
            risk_tier = "Medium"
        else:
            risk_tier = "Low"

        profile = {
            "total_transactions": len(history),
            "avg_transaction": round(sum(amounts) / max(len(amounts), 1), 2),
            "max_transaction": round(max(amounts), 2) if amounts else 0,
            "previous_fraud_alerts": anomaly_count,
            "international_txn_pct": international_pct,
            "usual_locations": locations[:5],
            "risk_tier": risk_tier,
        }
        source = "Nessie API" if _nessie_client else "cached data"
    else:
        # Fallback to generated profile
        num_txns = random.randint(50, 200)
        profile = {
            "total_transactions": num_txns,
            "avg_transaction": round(random.uniform(30, 150), 2),
            "max_transaction": round(random.uniform(200, 800), 2),
            "previous_fraud_alerts": random.randint(0, 2),
            "international_txn_pct": round(random.uniform(0, 15), 1),
            "usual_locations": ["Pittsburgh, PA", "Philadelphia, PA"],
            "risk_tier": random.choice(["Low", "Low", "Low", "Medium", "Medium"]),
        }
        source = "simulated"

    lines = [f"Risk Profile for {account_id} (source: {source}):"]
    lines.append(f"  Total transactions: {profile['total_transactions']}")
    lines.append(f"  Avg transaction: ${profile['avg_transaction']:.2f}")
    lines.append(f"  Max transaction: ${profile['max_transaction']:.2f}")
    lines.append(f"  Previous fraud alerts: {profile['previous_fraud_alerts']}")
    lines.append(f"  International transactions: {profile['international_txn_pct']}%")
    lines.append(f"  Usual locations: {', '.join(profile['usual_locations'])}")
    lines.append(f"  Risk tier: {profile['risk_tier']}")
    return "\n".join(lines)


@tool
def run_kyc_check(account_id: str) -> str:
    """Run a KYC (Know Your Customer) identity fraud risk assessment for a bank account.
    Returns identity risk level, score, and any fraud flags detected."""
    from backend.kyc.engine import kyc_engine
    history = _account_histories.get(account_id, [])
    result = kyc_engine.assess(account_id, history)

    lines = [f"KYC Identity Risk Assessment for {account_id}:"]
    lines.append(f"  Risk Level: {result['risk_level'].upper()}")
    lines.append(f"  Risk Score: {result['risk_score']}/100")
    lines.append(f"  Address Match: {'Yes' if result['address_match'] else 'NO - MISMATCH'}")
    lines.append(f"  Customer ID: {result['customer_id'] or 'Unknown'}")
    lines.append(f"  Flags:")
    for flag in result["flags"]:
        lines.append(f"    - {flag}")
    return "\n".join(lines)


@tool
def recommend_action(action: str, summary: str) -> str:
    """Submit your final recommendation for the investigated alert.
    action: must be one of 'BLOCK', 'FLAG_FOR_REVIEW', or 'CLEAR'
    summary: a detailed explanation of your decision"""
    valid_actions = ["BLOCK", "FLAG_FOR_REVIEW", "CLEAR"]
    if action.upper() not in valid_actions:
        return f"Invalid action. Must be one of: {valid_actions}"
    return f"RECOMMENDATION SUBMITTED: {action.upper()}\nSummary: {summary}"


def _generate_mock_history(account_id: str) -> list:
    """Generate realistic transaction history for an account"""
    merchants = [
        ("Starbucks", "Coffee", "Pittsburgh", "US"),
        ("Giant Eagle", "Grocery", "Pittsburgh", "US"),
        ("Shell Gas", "Gas", "Pittsburgh", "US"),
        ("Chipotle", "Restaurant", "Pittsburgh", "US"),
        ("Amazon", "Online", "Seattle", "US"),
        ("Target", "Retail", "Pittsburgh", "US"),
    ]
    history = []
    base_time = datetime.utcnow() - timedelta(days=30)
    for i in range(20):
        m = random.choice(merchants)
        history.append({
            "merchant_name": m[0],
            "category": m[1],
            "city": m[2],
            "country": m[3],
            "amount": round(random.uniform(5, 120), 2),
            "timestamp": (base_time + timedelta(days=i * 1.5, hours=random.randint(8, 20))).isoformat(),
        })
    _account_histories[account_id] = history
    return history


def _generate_mock_merchant(merchant_id: str) -> dict:
    """Generate mock merchant data"""
    suspicious_ids = {"m100", "m101", "m102", "m103", "m104", "m105", "m106", "m107", "m108"}
    if merchant_id in suspicious_ids:
        data = {
            "name": "Unknown/Unverified Merchant",
            "category": "Unverified",
            "city": "Unknown",
            "country": "Unknown",
            "registration": "NOT REGISTERED",
            "years": "< 1 year",
            "fraud_reports": random.randint(5, 25),
            "trust_score": random.randint(5, 25),
        }
    else:
        data = {
            "name": f"Verified Business #{merchant_id}",
            "category": "Retail",
            "city": "Pittsburgh",
            "country": "US",
            "registration": "VERIFIED",
            "years": f"{random.randint(3, 20)} years",
            "fraud_reports": 0,
            "trust_score": random.randint(80, 98),
        }
    _merchant_data[merchant_id] = data
    return data
