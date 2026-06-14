"""
SENTINEX v2.0 — Event Normalizer
Transforms raw events from various sources into normalized ThreatEvent format
"""
from datetime import datetime
from typing import Dict, Any
from backend.core.models import ThreatEvent
import uuid


# ═══════════════════════════════════════
# Source-specific normalizers
# ═══════════════════════════════════════

def normalize_netflow(raw: Dict[str, Any]) -> ThreatEvent:
    """Normalize NetFlow/Zeek events."""
    return ThreatEvent(
        event_id=raw.get("event_id", str(uuid.uuid4())),
        timestamp=datetime.fromisoformat(raw["timestamp"]) if "timestamp" in raw else datetime.utcnow(),
        source_ip=raw.get("src_ip", raw.get("source_ip", "0.0.0.0")),
        destination_ip=raw.get("dst_ip", raw.get("destination_ip", "0.0.0.0")),
        destination_port=int(raw.get("dst_port", raw.get("destination_port", 0))),
        protocol=raw.get("protocol", "TCP"),
        bytes_transferred=int(raw.get("bytes_out", raw.get("bytes_transferred", 0))),
        packet_count=int(raw.get("packet_count", raw.get("packets", 0))),
        duration_ms=float(raw.get("duration_ms", raw.get("duration", 0))),
        event_type="netflow",
        raw_payload=raw,
        source_feed=raw.get("source_feed", "zeek"),
        geolocation=raw.get("geolocation"),
        asset_criticality=raw.get("asset_criticality", "MEDIUM"),
        tags=raw.get("tags", []),
    )


def normalize_syslog(raw: Dict[str, Any]) -> ThreatEvent:
    """Normalize syslog events."""
    return ThreatEvent(
        event_id=raw.get("event_id", str(uuid.uuid4())),
        timestamp=datetime.fromisoformat(raw["timestamp"]) if "timestamp" in raw else datetime.utcnow(),
        source_ip=raw.get("src_ip", raw.get("host", "0.0.0.0")),
        destination_ip=raw.get("dst_ip", "0.0.0.0"),
        destination_port=int(raw.get("dst_port", 0)),
        protocol=raw.get("protocol", "TCP"),
        bytes_transferred=0,
        packet_count=0,
        duration_ms=0.0,
        event_type="syslog",
        raw_payload=raw,
        source_feed=raw.get("source_feed", "wazuh"),
        asset_criticality=raw.get("asset_criticality", "MEDIUM"),
        tags=raw.get("tags", []),
    )


def normalize_endpoint(raw: Dict[str, Any]) -> ThreatEvent:
    """Normalize endpoint telemetry events."""
    return ThreatEvent(
        event_id=raw.get("event_id", str(uuid.uuid4())),
        timestamp=datetime.fromisoformat(raw["timestamp"]) if "timestamp" in raw else datetime.utcnow(),
        source_ip=raw.get("src_ip", raw.get("host_ip", "0.0.0.0")),
        destination_ip=raw.get("dst_ip", "0.0.0.0"),
        event_type="endpoint",
        raw_payload=raw,
        source_feed=raw.get("source_feed", "osquery"),
        asset_criticality=raw.get("asset_criticality", "HIGH"),
        tags=raw.get("tags", ["endpoint"]),
    )


def normalize_cve(raw: Dict[str, Any]) -> ThreatEvent:
    """Normalize CVE/NVD feed events."""
    return ThreatEvent(
        event_id=raw.get("event_id", str(uuid.uuid4())),
        timestamp=datetime.fromisoformat(raw["timestamp"]) if "timestamp" in raw else datetime.utcnow(),
        source_ip="0.0.0.0",
        destination_ip="0.0.0.0",
        event_type="cve",
        raw_payload=raw,
        source_feed="nvd",
        asset_criticality=raw.get("severity", "MEDIUM"),
        tags=raw.get("tags", ["cve"]),
    )


# ═══════════════════════════════════════
# Unified normalizer
# ═══════════════════════════════════════

NORMALIZERS = {
    "netflow": normalize_netflow,
    "syslog": normalize_syslog,
    "endpoint": normalize_endpoint,
    "cve": normalize_cve,
}


def normalize_event(raw: Dict[str, Any]) -> ThreatEvent:
    """Normalize any raw event to ThreatEvent schema."""
    event_type = raw.get("event_type", "netflow")
    normalizer = NORMALIZERS.get(event_type, normalize_netflow)
    return normalizer(raw)
