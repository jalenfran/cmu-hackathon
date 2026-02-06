"""Governance and compliance API endpoints"""

import random
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api/governance", tags=["governance"])

# Cloud Custodian action log (simulated)
CUSTODIAN_ACTIONS = [
    {"action": "Auto-encrypted S3 bucket", "resource": "sentinel-reports-prod", "timestamp": None, "status": "remediated"},
    {"action": "Terminated untagged EC2 instance", "resource": "i-0abc123def456", "timestamp": None, "status": "remediated"},
    {"action": "Flagged IAM role with broad permissions", "resource": "SentinelAgentRole", "timestamp": None, "status": "alert"},
    {"action": "Enabled CloudTrail logging", "resource": "us-east-1", "timestamp": None, "status": "remediated"},
    {"action": "Auto-encrypted S3 bucket", "resource": "sentinel-agent-logs", "timestamp": None, "status": "remediated"},
    {"action": "Terminated orphaned EBS volume", "resource": "vol-0def789abc012", "timestamp": None, "status": "remediated"},
]

POLICIES = [
    {"name": "S3 Encryption", "type": "Cloud Custodian", "status": "passing", "checks": 12, "violations": 0},
    {"name": "Resource Tagging", "type": "Cloud Custodian", "status": "passing", "checks": 8, "violations": 0},
    {"name": "IAM Audit", "type": "Cloud Custodian", "status": "warning", "checks": 15, "violations": 2},
    {"name": "CloudTrail Logging", "type": "Cloud Custodian", "status": "passing", "checks": 4, "violations": 0},
    {"name": "Transaction Amount Limits", "type": "OPA", "status": "passing", "checks": 1250, "violations": 3},
    {"name": "International MFA", "type": "OPA", "status": "passing", "checks": 89, "violations": 1},
    {"name": "Sanctioned Countries", "type": "OPA", "status": "passing", "checks": 1250, "violations": 0},
    {"name": "Velocity Limits", "type": "OPA", "status": "passing", "checks": 1250, "violations": 5},
]


@router.get("/scorecard")
async def get_scorecard():
    total_checks = sum(p["checks"] for p in POLICIES)
    total_violations = sum(p["violations"] for p in POLICIES)
    compliance_pct = round((1 - total_violations / max(total_checks, 1)) * 100, 1)

    return {
        "compliance_percentage": compliance_pct,
        "total_checks": total_checks,
        "total_violations": total_violations,
        "policies": POLICIES,
        "last_scan": datetime.utcnow().isoformat(),
    }


@router.get("/actions")
async def get_custodian_actions():
    """Return recent Cloud Custodian remediation actions"""
    now = datetime.utcnow()
    actions = []
    for i, action in enumerate(CUSTODIAN_ACTIONS):
        a = dict(action)
        a["timestamp"] = (now - timedelta(minutes=random.randint(5, 120) + i * 30)).isoformat()
        actions.append(a)
    return actions


@router.get("/policies")
async def get_policies():
    """Return all configured governance policies"""
    return {
        "cloud_custodian": {
            "total": 4,
            "active": 4,
            "policies": [p for p in POLICIES if p["type"] == "Cloud Custodian"],
        },
        "opa": {
            "total": 4,
            "active": 4,
            "policies": [p for p in POLICIES if p["type"] == "OPA"],
        },
    }
