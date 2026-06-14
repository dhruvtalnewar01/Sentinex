"""
SENTINEX v2.0 — Alerts API Routes
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["alerts"])

# Re-use incident store for alerts view
alert_store: list = []


@router.get("/alerts")
async def list_alerts(
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List alerts sorted by score, paginated."""
    filtered = alert_store
    if severity:
        filtered = [a for a in filtered if a.get("incident_severity") == severity]

    filtered.sort(key=lambda x: x.get("cvss_score", 0), reverse=True)

    return {
        "alerts": filtered[offset:offset + limit],
        "total": len(filtered),
    }


def add_alert(alert_data: dict):
    """Add an alert."""
    alert_store.insert(0, alert_data)
    if len(alert_store) > 500:
        alert_store.pop()
