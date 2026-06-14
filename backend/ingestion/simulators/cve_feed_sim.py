"""
SENTINEX v2.0 — CVE Feed Simulator
Generates synthetic CVE/NVD feed events
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


CVE_ENTRIES = [
    {"cve_id": "CVE-2024-3400", "severity": "CRITICAL", "cvss": 10.0, "product": "Palo Alto PAN-OS", "description": "Command injection in GlobalProtect"},
    {"cve_id": "CVE-2024-21762", "severity": "CRITICAL", "cvss": 9.8, "product": "Fortinet FortiOS", "description": "Out-of-bound write in SSL VPN"},
    {"cve_id": "CVE-2023-46805", "severity": "HIGH", "cvss": 8.2, "product": "Ivanti Connect Secure", "description": "Authentication bypass"},
    {"cve_id": "CVE-2024-1709", "severity": "CRITICAL", "cvss": 10.0, "product": "ConnectWise ScreenConnect", "description": "Authentication bypass"},
    {"cve_id": "CVE-2023-4966", "severity": "HIGH", "cvss": 7.5, "product": "Citrix NetScaler", "description": "Sensitive information disclosure"},
    {"cve_id": "CVE-2024-27198", "severity": "CRITICAL", "cvss": 9.8, "product": "JetBrains TeamCity", "description": "Authentication bypass"},
    {"cve_id": "CVE-2023-22527", "severity": "CRITICAL", "cvss": 9.8, "product": "Atlassian Confluence", "description": "Template injection RCE"},
]


def generate_cve_events(count: int = 20) -> List[Dict[str, Any]]:
    """Generate synthetic CVE feed events."""
    events = []
    base_time = datetime.utcnow()

    for i in range(count):
        cve = random.choice(CVE_ENTRIES)
        events.append({
            "event_id": str(uuid.uuid4()),
            "timestamp": (base_time + timedelta(hours=i)).isoformat(),
            "event_type": "cve",
            "cve_id": cve["cve_id"],
            "severity": cve["severity"],
            "cvss_score": cve["cvss"],
            "product": cve["product"],
            "description": cve["description"],
            "source_feed": "nvd",
            "affected_assets": [f"10.0.{random.randint(1,4)}.{random.randint(10,50)}"],
            "exploit_available": random.random() > 0.5,
            "tags": ["cve", cve["severity"].lower()],
        })

    return events
