"""
SENTINEX v2.0 — NetFlow Simulator
Generates synthetic NetFlow events mimicking APT28 lateral movement patterns
"""
import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.core.logging import get_logger

logger = get_logger("simulator.netflow")

# ═══════════════════════════════════════
# APT28 Lateral Movement Attack Sequence
# ═══════════════════════════════════════

ATTACKER_IPS = ["185.220.101.47", "45.33.32.156", "198.51.100.23"]
INTERNAL_IPS = ["10.0.1.50", "10.0.2.20", "10.0.3.15", "10.0.2.10", "10.0.4.30"]
C2_SERVERS = ["45.33.32.156", "91.134.128.11", "185.141.25.68"]

APT28_ATTACK_PHASES = [
    # Phase 1: Reconnaissance (Port Scanning)
    {"phase": "reconnaissance", "count": 50, "generator": "port_scan"},
    # Phase 2: Initial Access (SQL Injection attempts)
    {"phase": "initial_access", "count": 30, "generator": "sql_injection"},
    # Phase 3: Execution (Payload delivery)
    {"phase": "execution", "count": 20, "generator": "payload_exec"},
    # Phase 4: Persistence (Backdoor installation)
    {"phase": "persistence", "count": 15, "generator": "backdoor"},
    # Phase 5: Lateral Movement (SSH pivoting)
    {"phase": "lateral_movement", "count": 80, "generator": "lateral_move"},
    # Phase 6: Collection & Exfiltration
    {"phase": "exfiltration", "count": 40, "generator": "data_exfil"},
    # Phase 7: C2 Beaconing
    {"phase": "command_and_control", "count": 265, "generator": "c2_beacon"},
]


def _gen_port_scan(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 0.1)).isoformat(),
        "event_type": "netflow",
        "src_ip": ATTACKER_IPS[0],
        "dst_ip": random.choice(INTERNAL_IPS),
        "dst_port": random.randint(1, 65535),
        "protocol": "TCP",
        "bytes_transferred": random.randint(40, 120),
        "packet_count": random.randint(1, 3),
        "duration_ms": random.uniform(0.5, 5.0),
        "action": "TCP_SYN",
        "ports_scanned": random.randint(20, 100),
        "source_feed": "zeek",
        "geolocation": {"country": "RU", "city": "Moscow", "lat": 55.7558, "lon": 37.6173},
        "asset_criticality": "MEDIUM",
        "tags": ["recon", "port_scan"],
    }


def _gen_sql_injection(base_time: datetime, idx: int) -> Dict[str, Any]:
    payloads = [
        "' OR '1'='1' --",
        "UNION SELECT username,password FROM users--",
        "'; DROP TABLE sessions;--",
        "1' AND SLEEP(5)--",
        "admin'/*",
    ]
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 2)).isoformat(),
        "event_type": "http_request",
        "src_ip": ATTACKER_IPS[0],
        "dst_ip": "10.0.1.50",
        "dst_port": 443,
        "protocol": "TCP",
        "bytes_transferred": random.randint(200, 2000),
        "packet_count": random.randint(5, 20),
        "duration_ms": random.uniform(50, 500),
        "action": "POST /api/login",
        "payload": random.choice(payloads),
        "source_feed": "wazuh",
        "geolocation": {"country": "RU", "city": "Moscow", "lat": 55.7558, "lon": 37.6173},
        "asset_criticality": "CRITICAL",
        "tags": ["sqli", "initial_access", "T1190"],
    }


def _gen_payload_exec(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 3)).isoformat(),
        "event_type": "endpoint",
        "src_ip": ATTACKER_IPS[0],
        "dst_ip": "10.0.1.50",
        "dst_port": 0,
        "protocol": "TCP",
        "bytes_transferred": random.randint(5000, 50000),
        "action": "process_create",
        "payload": "/tmp/.hidden/payload.sh",
        "source_feed": "osquery",
        "asset_criticality": "CRITICAL",
        "tags": ["execution", "T1059"],
    }


def _gen_backdoor(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 5)).isoformat(),
        "event_type": "endpoint",
        "src_ip": "10.0.1.50",
        "dst_ip": "10.0.1.50",
        "action": "persistence_install",
        "payload": "crontab -e '*/5 * * * * /tmp/.hidden/beacon.sh'",
        "source_feed": "osquery",
        "asset_criticality": "CRITICAL",
        "tags": ["persistence", "T1053"],
    }


def _gen_lateral_move(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 1.5)).isoformat(),
        "event_type": "netflow",
        "src_ip": random.choice(INTERNAL_IPS[:2]),
        "dst_ip": random.choice(INTERNAL_IPS[2:]),
        "dst_port": random.choice([22, 3389, 445, 135]),
        "protocol": "TCP",
        "bytes_transferred": random.randint(500, 10000),
        "packet_count": random.randint(10, 100),
        "duration_ms": random.uniform(100, 5000),
        "action": "SSH_AUTH",
        "failed_logins": random.randint(0, 3),
        "source_feed": "zeek",
        "asset_criticality": "HIGH",
        "tags": ["lateral_movement", "T1021"],
    }


def _gen_data_exfil(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 4)).isoformat(),
        "event_type": "netflow",
        "src_ip": random.choice(INTERNAL_IPS),
        "dst_ip": random.choice(C2_SERVERS),
        "dst_port": 443,
        "protocol": "TCP",
        "bytes_transferred": random.randint(1_000_000, 100_000_000),
        "bytes_out": random.randint(10_000_000, 100_000_000),
        "packet_count": random.randint(1000, 50000),
        "duration_ms": random.uniform(5000, 30000),
        "action": "HTTPS_POST",
        "payload": "encrypted_blob",
        "source_feed": "zeek",
        "geolocation": {"country": "RU", "city": "Saint Petersburg", "lat": 59.9343, "lon": 30.3351},
        "asset_criticality": "CRITICAL",
        "tags": ["exfiltration", "T1048"],
    }


def _gen_c2_beacon(base_time: datetime, idx: int) -> Dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "timestamp": (base_time + timedelta(seconds=idx * 30)).isoformat(),
        "event_type": "netflow",
        "src_ip": random.choice(INTERNAL_IPS[:3]),
        "dst_ip": random.choice(C2_SERVERS),
        "dst_port": random.choice([443, 8443, 53]),
        "protocol": "TCP",
        "bytes_transferred": random.randint(100, 500),
        "packet_count": random.randint(2, 10),
        "duration_ms": random.uniform(50, 200),
        "action": "GET /api/check",
        "beacon_interval": 30,
        "source_feed": "zeek",
        "geolocation": {"country": "DE", "city": "Frankfurt", "lat": 50.1109, "lon": 8.6821},
        "asset_criticality": "HIGH",
        "tags": ["c2", "T1071", "beacon"],
    }


GENERATORS = {
    "port_scan": _gen_port_scan,
    "sql_injection": _gen_sql_injection,
    "payload_exec": _gen_payload_exec,
    "backdoor": _gen_backdoor,
    "lateral_move": _gen_lateral_move,
    "data_exfil": _gen_data_exfil,
    "c2_beacon": _gen_c2_beacon,
}


def generate_apt28_attack(count: int = 500) -> List[Dict[str, Any]]:
    """Generate a complete APT28 lateral movement attack sequence."""
    events = []
    base_time = datetime.utcnow()
    session_id = f"APT28-{uuid.uuid4().hex[:8].upper()}"

    for phase in APT28_ATTACK_PHASES:
        gen = GENERATORS[phase["generator"]]
        phase_count = min(phase["count"], count - len(events))
        if phase_count <= 0:
            break

        for i in range(phase_count):
            event = gen(base_time, i)
            event["session_id"] = session_id
            event["attack_phase"] = phase["phase"]
            event["sequence"] = len(events) + 1
            events.append(event)

        base_time += timedelta(minutes=random.randint(2, 10))

    logger.info("apt28_attack_generated", event_count=len(events), session_id=session_id)
    return events


if __name__ == "__main__":
    events = generate_apt28_attack(500)
    print(f"Generated {len(events)} APT28 attack events")
    print(json.dumps(events[:3], indent=2, default=str))
