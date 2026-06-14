"""
SENTINEX v2.0 — Incidents API Routes
"""
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["incidents"])

# In-memory store for MVP
incident_store: list = []


@router.get("/incidents")
async def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List incidents sorted by CVSS score descending."""
    filtered = incident_store

    if status:
        filtered = [i for i in filtered if i.get("status") == status]
    if severity:
        filtered = [i for i in filtered if i.get("incident_severity") == severity]

    # Sort by CVSS score descending
    filtered.sort(key=lambda x: x.get("cvss_score", 0), reverse=True)

    return {
        "incidents": filtered[offset:offset + limit],
        "total": len(filtered),
        "limit": limit,
        "offset": offset,
    }


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get a single incident with full details."""
    for incident in incident_store:
        if incident.get("incident_id") == incident_id:
            return incident
    return {"error": "Incident not found", "incident_id": incident_id}


def add_incident(incident: dict):
    """Add an incident to the store."""
    incident["created_at"] = datetime.utcnow().isoformat()
    incident["updated_at"] = datetime.utcnow().isoformat()
    incident_store.insert(0, incident)
    # Keep max 500
    if len(incident_store) > 500:
        incident_store.pop()
