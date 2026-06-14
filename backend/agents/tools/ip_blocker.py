"""
SENTINEX v2.0 — IP Blocker
pfSense/Cloudflare firewall API stub for autonomous IP blocking
"""
from typing import Dict, Any, Set
from datetime import datetime
from backend.core.logging import get_logger

logger = get_logger("ip_blocker")

# In-memory blocked IPs for demo
BLOCKED_IPS: Set[str] = set()
BLOCK_LOG: list = []


async def block_ip(ip: str, reason: str = "", duration_hours: int = 24,
                   source: str = "sentinex") -> Dict[str, Any]:
    """Block an IP address via firewall API (stub for demo)."""
    try:
        BLOCKED_IPS.add(ip)
        entry = {
            "ip": ip,
            "reason": reason,
            "duration_hours": duration_hours,
            "source": source,
            "blocked_at": datetime.utcnow().isoformat(),
            "status": "BLOCKED",
        }
        BLOCK_LOG.append(entry)
        logger.warning("ip_blocked", ip=ip, reason=reason, duration=f"{duration_hours}h")
        return {"status": "BLOCKED", "ip": ip, "action": "firewall_rule_created"}
    except Exception as e:
        logger.error("ip_block_failed", ip=ip, error=str(e))
        return {"status": "FAILED", "ip": ip, "error": str(e)}


async def unblock_ip(ip: str) -> Dict[str, Any]:
    """Remove an IP block."""
    BLOCKED_IPS.discard(ip)
    logger.info("ip_unblocked", ip=ip)
    return {"status": "UNBLOCKED", "ip": ip}


def get_blocked_ips() -> list:
    """Get all currently blocked IPs."""
    return list(BLOCKED_IPS)


def get_block_log() -> list:
    """Get the full block log."""
    return BLOCK_LOG


def is_blocked(ip: str) -> bool:
    """Check if an IP is currently blocked."""
    return ip in BLOCKED_IPS
