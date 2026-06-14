"""
SENTINEX v2.0 — FastAPI Application Entrypoint
Main application with all routers, WebSocket, and demo endpoints
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

from backend.core.config import get_settings
from backend.core.logging import get_logger
from backend.agents.graph import SentinexOrchestrator
from backend.api.routes.incidents import router as incidents_router, add_incident
from backend.api.routes.alerts import router as alerts_router, add_alert
from backend.api.routes.agents import router as agents_router
from backend.api.routes.query import router as query_router
from backend.api.routes.hitl import router as hitl_router
from backend.api.websocket import ws_manager
from backend.ingestion.simulators.netflow_sim import generate_apt28_attack

logger = get_logger("main")
settings = get_settings()

# ── Orchestrator ──
orchestrator = SentinexOrchestrator()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    logger.info("sentinex_starting", version="2.0", environment=settings.environment)
    yield
    logger.info("sentinex_shutdown")


app = FastAPI(
    title="SENTINEX API",
    description="Autonomous Multi-Agent Cybersecurity Operations Platform",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(agents_router)
app.include_router(query_router)
app.include_router(hitl_router)


# ── WebSocket ──
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ── Health ──
@app.get("/health")
async def health():
    return {
        "status": "🟢 SENTINEX OPERATIONAL",
        "version": "2.0.0",
        "agents": 5,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Event Ingestion ──
@app.post("/api/v1/events")
async def ingest_event(event: dict, background_tasks: BackgroundTasks):
    """Receive a ThreatEvent and enqueue to agent graph."""
    background_tasks.add_task(process_event_pipeline, event)
    return {"event_id": event.get("event_id", ""), "queued": True}


async def process_event_pipeline(raw_event: dict):
    """Process a single event through the full agent pipeline."""
    try:
        # Broadcast agent activations
        await ws_manager.send_agent_update("threat_hunter", "ACTIVE")

        result = await orchestrator.process_event(raw_event)

        if result.get("threat_score", 0) > settings.threat_score_threshold:
            # Store incident
            incident_data = dict(result)
            add_incident(incident_data)
            add_alert(incident_data)

            # Broadcast to frontend
            await ws_manager.send_incident_created(incident_data)

        # Reset agents to idle
        for agent in ["threat_hunter", "soc_analyst", "incident_responder", "forensics_agent", "risk_scorer"]:
            await ws_manager.send_agent_update(agent, "IDLE")

    except Exception as e:
        logger.error("pipeline_error", error=str(e))


# ── Demo Attack Simulation ──
@app.post("/api/v1/demo/trigger")
async def trigger_demo(background_tasks: BackgroundTasks):
    """Trigger a demo APT28 attack simulation."""
    background_tasks.add_task(run_demo_simulation)
    return {"status": "started", "message": "APT28 lateral movement simulation started"}


async def run_demo_simulation():
    """Run the full demo attack sequence."""
    logger.info("demo_simulation_started")
    events = generate_apt28_attack(500)

    # Process a subset of key events through the pipeline
    key_events = [e for e in events if e.get("attack_phase") in [
        "reconnaissance", "initial_access", "lateral_movement", "exfiltration", "command_and_control"
    ]][:10]

    for event in key_events:
        await process_event_pipeline(event)
        await asyncio.sleep(2)  # Stagger for visual effect

    logger.info("demo_simulation_complete", events_processed=len(key_events))


# ── Run ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
