"""LangChain tools for the fraud investigation agent"""

import random
from datetime import datetime, timedelta
from langchain_core.tools import tool

from backend.anomaly_detection.features import haversine


# In-memory data store for tool responses (populated by the producer)
_account_histories = {}
_merchant_data = {}


def set_account_history(account_id: str, transactions: list):
    _account_histories[account_id] = transactions


def set_merchant_data(merchant_id: str, data: dict):
    _merchant_data[merchant_id] = data


@tool
def check_account_history(account_id: str) -> str:
    """Check the recent transaction history for a bank account. Returns the last 20 transactions."""
    history = _account_histories.get(account_id, [])
    if not history:
        # Generate realistic mock history
        history = _generate_mock_history(account_id)

    recent = history[-20:]
    lines = [f"Recent transactions for account {account_id} ({len(recent)} shown):"]
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

    lines = [f"Merchant Verification Report for {merchant_id}:"]
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
    # Generate realistic risk profile
    history = _account_histories.get(account_id, [])
    num_txns = len(history) if history else random.randint(50, 200)

    profile = {
        "account_age_months": random.randint(6, 60),
        "total_transactions": num_txns,
        "avg_monthly_spend": round(random.uniform(800, 3500), 2),
        "previous_fraud_alerts": random.randint(0, 2),
        "international_txn_pct": round(random.uniform(0, 15), 1),
        "usual_locations": ["Pittsburgh, PA", "Philadelphia, PA"],
        "risk_tier": random.choice(["Low", "Low", "Low", "Medium", "Medium"]),
    }

    lines = [f"Risk Profile for {account_id}:"]
    lines.append(f"  Account age: {profile['account_age_months']} months")
    lines.append(f"  Total transactions: {profile['total_transactions']}")
    lines.append(f"  Avg monthly spend: ${profile['avg_monthly_spend']:.2f}")
    lines.append(f"  Previous fraud alerts: {profile['previous_fraud_alerts']}")
    lines.append(f"  International transactions: {profile['international_txn_pct']}%")
    lines.append(f"  Usual locations: {', '.join(profile['usual_locations'])}")
    lines.append(f"  Risk tier: {profile['risk_tier']}")
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
    suspicious_ids = {"m100", "m101", "m102", "m103", "m104", "m105"}
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
