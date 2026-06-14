"""
SENTINEX v2.0 — WebSocket Live Event Streaming
Real-time event push to frontend via WebSocket
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
from datetime import datetime
from backend.core.logging import get_logger

logger = get_logger("websocket")


class ConnectionManager:
    """Manages WebSocket connections for live event streaming."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("ws_client_connected", total=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("ws_client_disconnected", total=len(self.active_connections))

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    async def send_event(self, event_type: str, data: Dict[str, Any]):
        """Send a typed event to all clients."""
        await self.broadcast({
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        })

    async def send_new_event(self, event_id: str, threat_score: float):
        await self.send_event("NEW_EVENT", {
            "event_id": event_id,
            "threat_score": threat_score,
        })

    async def send_incident_created(self, incident: Dict[str, Any]):
        await self.send_event("INCIDENT_CREATED", incident)

    async def send_agent_update(self, agent_name: str, status: str, event_id: str = ""):
        await self.send_event("AGENT_STATE_UPDATE", {
            "agent_name": agent_name,
            "status": status,
            "current_event_id": event_id,
        })

    async def send_response_action(self, action: str, target_ip: str, result: str):
        await self.send_event("RESPONSE_ACTION", {
            "action": action,
            "target_ip": target_ip,
            "result": result,
        })

    async def send_hitl_required(self, incident_id: str, reason: str, recommended: str):
        await self.send_event("HITL_REQUIRED", {
            "incident_id": incident_id,
            "reason": reason,
            "recommended_action": recommended,
        })


# Singleton
ws_manager = ConnectionManager()
