"""KYC Risk Assessment Engine - Screens customers for identity fraud indicators"""

import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory store for customer data (populated by Nessie seeder)
_customer_data: dict = {}
_account_to_customer: dict = {}


def set_customer_data(customer_id: str, data: dict):
    """Store customer profile data for KYC checks"""
    _customer_data[customer_id] = data


def set_account_customer_mapping(account_id: str, customer_id: str):
    """Map an account ID to its owner's customer ID"""
    _account_to_customer[account_id] = customer_id


def get_customer_for_account(account_id: str) -> Optional[str]:
    """Look up which customer owns an account"""
    return _account_to_customer.get(account_id)


class KYCRiskEngine:
    """Screens customer profiles for identity fraud indicators.

    Combines customer profile data (address, account info) with
    behavioral signals from transaction patterns to compute a
    composite identity risk score.
    """

    def assess(self, account_id: str, transaction_history: list) -> dict:
        """Run full KYC risk assessment for an account.

        Returns a dict with:
            account_id, customer_id, risk_level, risk_score (0-100),
            flags (list[str]), address_match, account_age_days, assessed_at
        """
        customer_id = _account_to_customer.get(account_id)
        customer = _customer_data.get(customer_id, {}) if customer_id else {}
        customer_address = customer.get("address", {})
        customer_state = customer_address.get("state", "").upper()
        customer_city = customer_address.get("city", "").lower()

        flags: list[str] = []
        score = 0.0

        # 1. Address consistency - do transactions match customer address?
        if transaction_history and customer_city:
            txn_cities = [
                t.get("city", "").lower()
                for t in transaction_history
                if t.get("city")
            ]
            if txn_cities:
                local_count = sum(
                    1 for c in txn_cities
                    if customer_city in c or c in customer_city
                )
                match_pct = local_count / len(txn_cities) * 100
                address_match = match_pct > 30
                if match_pct < 10:
                    flags.append(
                        f"Transaction locations don't match registered address "
                        f"({customer_city.title()}: {match_pct:.0f}% match)"
                    )
                    score += 25
            else:
                address_match = True  # No city data, assume match
        else:
            address_match = True

        # 2. Spending velocity - high spend on accounts
        if transaction_history:
            amounts = [t.get("amount", 0) for t in transaction_history]
            total_spend = sum(amounts)
            avg_txn = total_spend / max(len(amounts), 1)
            max_txn = max(amounts) if amounts else 0

            if avg_txn > 500:
                flags.append(
                    f"High average transaction amount (${avg_txn:.2f})"
                )
                score += 15

            if max_txn > 5000:
                flags.append(
                    f"Very high single transaction (${max_txn:.2f})"
                )
                score += 20

        # 3. Transaction diversity - legitimate accounts have varied merchants
        if transaction_history:
            categories = [
                t.get("category", "Unknown") for t in transaction_history
            ]
            unique_categories = set(categories)
            if len(categories) >= 5 and len(unique_categories) <= 2:
                dominant = max(set(categories), key=categories.count)
                dominant_pct = categories.count(dominant) / len(categories) * 100
                flags.append(
                    f"Single merchant category dominance "
                    f"({dominant}: {dominant_pct:.0f}%)"
                )
                score += 20

        # 4. Geographic dispersion - many distant cities in short period
        if transaction_history:
            cities = list(set(
                t.get("city", "Unknown")
                for t in transaction_history[-15:]
                if t.get("city") and t.get("city") != "Unknown"
            ))
            if len(cities) >= 5:
                flags.append(
                    f"Geographic dispersion: {len(cities)} cities in recent transactions"
                )
                score += 15

        # 5. International transaction ratio
        if transaction_history:
            countries = [t.get("country", "US") for t in transaction_history]
            international = sum(1 for c in countries if c != "US")
            intl_pct = international / max(len(countries), 1) * 100
            if intl_pct > 30:
                flags.append(
                    f"High international transaction ratio ({intl_pct:.0f}%)"
                )
                score += 20

        # 6. Multiple accounts per customer (synthetic identity indicator)
        if customer_id:
            accounts_for_customer = [
                aid for aid, cid in _account_to_customer.items()
                if cid == customer_id
            ]
            if len(accounts_for_customer) > 3:
                flags.append(
                    f"Customer has {len(accounts_for_customer)} accounts "
                    f"(synthetic identity indicator)"
                )
                score += 15

        # Cap score at 100
        score = min(score, 100.0)

        # Determine risk level
        if score >= 60:
            risk_level = "critical"
        elif score >= 40:
            risk_level = "high"
        elif score >= 20:
            risk_level = "medium"
        else:
            risk_level = "low"

        # If no flags were raised, explicitly note it
        if not flags:
            flags.append("No identity fraud indicators detected")

        return {
            "account_id": account_id,
            "customer_id": customer_id,
            "risk_level": risk_level,
            "risk_score": round(score, 1),
            "flags": flags,
            "address_match": address_match,
            "account_age_days": 30,  # Nessie doesn't provide creation date
            "assessed_at": datetime.utcnow().isoformat(),
        }


# Singleton engine instance
kyc_engine = KYCRiskEngine()
