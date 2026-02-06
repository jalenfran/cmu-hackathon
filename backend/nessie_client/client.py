"""
Nessie API Client - Integration with Capital One's banking API
Handles authentication, account data retrieval, and transaction monitoring
"""

import httpx
import asyncio
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@dataclass
class Transaction:
    """Represents a transaction from Nessie API"""
    id: str
    type: str
    merchant: str
    amount: float
    date: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    merchant_id: Optional[str] = None

@dataclass
class Account:
    """Represents a bank account"""
    id: str
    user_id: str
    account_type: str
    balance: float

class NessieClient:
    """Client for Capital One's Nessie API"""

    def __init__(self, api_key: str, base_url: str = "http://api.nessieisreal.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.session = {"key": api_key}

    async def get_accounts(self, limit: int = 10) -> List[Account]:
        """Fetch all user accounts"""
        try:
            response = await self.client.get(
                f"{self.base_url}/accounts",
                params={"key": self.api_key, "limit": limit}
            )
            response.raise_for_status()
            accounts = response.json()
            return [
                Account(
                    id=acc["_id"],
                    user_id=acc.get("user_id", ""),
                    account_type=acc.get("type", ""),
                    balance=acc.get("balance", 0)
                )
                for acc in accounts
            ]
        except httpx.HTTPError as e:
            logger.error(f"Error fetching accounts: {e}")
            return []

    async def get_purchases(self, account_id: str, limit: int = 50) -> List[Transaction]:
        """Fetch recent purchases for an account"""
        try:
            response = await self.client.get(
                f"{self.base_url}/accounts/{account_id}/purchases",
                params={"key": self.api_key, "limit": limit}
            )
            response.raise_for_status()
            purchases = response.json()
            return [
                Transaction(
                    id=p["_id"],
                    type="purchase",
                    merchant=p.get("merchant_id", ""),
                    amount=p.get("amount", 0),
                    date=p.get("purchase_date", ""),
                    latitude=p.get("lat"),
                    longitude=p.get("lng"),
                    merchant_id=p.get("merchant_id")
                )
                for p in purchases
            ]
        except httpx.HTTPError as e:
            logger.error(f"Error fetching purchases for {account_id}: {e}")
            return []

    async def get_merchant_details(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        """Get merchant information for legitimacy verification"""
        try:
            response = await self.client.get(
                f"{self.base_url}/merchants/{merchant_id}",
                params={"key": self.api_key}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching merchant {merchant_id}: {e}")
            return None

    async def get_atm_locations(self) -> List[Dict[str, Any]]:
        """Get ATM locations for impossible travel detection"""
        try:
            response = await self.client.get(
                f"{self.base_url}/enterprise/atms",
                params={"key": self.api_key}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching ATM locations: {e}")
            return []

    async def block_account(self, account_id: str, reason: str) -> bool:
        """Block an account (trigger fraud response)"""
        try:
            response = await self.client.put(
                f"{self.base_url}/accounts/{account_id}",
                json={"blocked": True, "block_reason": reason},
                params={"key": self.api_key}
            )
            response.raise_for_status()
            logger.info(f"Account {account_id} blocked: {reason}")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Error blocking account {account_id}: {e}")
            return False

    async def close(self):
        """Close the client connection"""
        await self.client.aclose()


async def test_client():
    """Quick test of the Nessie client"""
    # This would use actual API key from environment
    client = NessieClient(api_key="test_key")
    try:
        accounts = await client.get_accounts(limit=5)
        print(f"Found {len(accounts)} accounts")
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(test_client())
