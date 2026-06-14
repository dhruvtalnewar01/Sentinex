"""
SENTINEX v2.0 — Agents Status API
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["agents"])

# Agent status tracking
agent_statuses = {
    "threat_hunter": {"agent_name": "Threat Hunter", "status": "IDLE", "last_run": None, "events_processed": 0, "avg_latency_ms": 0},
    "soc_analyst": {"agent_name": "SOC Analyst", "status": "IDLE", "last_run": None, "events_processed": 0, "avg_latency_ms": 0},
    "incident_responder": {"agent_name": "Incident Responder", "status": "IDLE", "last_run": None, "events_processed": 0, "avg_latency_ms": 0},
    "forensics_agent": {"agent_name": "Forensics Agent", "status": "IDLE", "last_run": None, "events_processed": 0, "avg_latency_ms": 0},
    "risk_scorer": {"agent_name": "Risk Scorer", "status": "IDLE", "last_run": None, "events_processed": 0, "avg_latency_ms": 0},
}


@router.get("/agents/status")
async def get_agent_status():
    """Get health status of all 5 agents."""
    return {"agents": list(agent_statuses.values())}


def update_agent_status(agent_key: str, status: str, latency_ms: float = 0):
    """Update an agent's status after processing."""
    if agent_key in agent_statuses:
        agent_statuses[agent_key]["status"] = status
        agent_statuses[agent_key]["last_run"] = datetime.utcnow().isoformat()
        agent_statuses[agent_key]["events_processed"] += 1
        # Running average
        prev = agent_statuses[agent_key]["avg_latency_ms"]
        count = agent_statuses[agent_key]["events_processed"]
        agent_statuses[agent_key]["avg_latency_ms"] = round(
            (prev * (count - 1) + latency_ms) / count, 1
        )
