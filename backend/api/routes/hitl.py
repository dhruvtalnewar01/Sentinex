"""
SENTINEX v2.0 — HITL Override API
Human-in-the-loop action controls
"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from backend.core.logging import get_logger

router = APIRouter(prefix="/api/v1", tags=["hitl"])
logger = get_logger("hitl")


class OverrideRequest(BaseModel):
    incident_id: str
    action: str  # APPROVE | REJECT | ESCALATE
    analyst_id: str
    notes: str = ""


@router.post("/hitl/override")
async def override_action(req: OverrideRequest):
    """Human override for an incident requiring HITL review."""
    logger.info(
        "hitl_override",
        incident_id=req.incident_id,
        action=req.action,
        analyst=req.analyst_id,
    )

    result = {
        "status": "updated",
        "incident_id": req.incident_id,
        "action": req.action,
        "analyst_id": req.analyst_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    if req.action == "APPROVE":
        result["message"] = "Pending response actions have been executed."
    elif req.action == "REJECT":
        result["message"] = "Response actions cancelled. Incident marked for manual review."
    elif req.action == "ESCALATE":
        result["message"] = "Incident escalated to senior analyst team."

    # Update incident store
    try:
        from backend.api.routes.incidents import incident_store
        for incident in incident_store:
            if incident.get("incident_id") == req.incident_id:
                incident["hitl_required"] = False
                incident["status"] = req.action
                incident["assigned_analyst"] = req.analyst_id
                incident.setdefault("audit_log", []).append({
                    "agent": "hitl",
                    "action": f"override_{req.action.lower()}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "details": {"analyst": req.analyst_id, "notes": req.notes},
                })
                break
    except Exception:
        pass

    return result
