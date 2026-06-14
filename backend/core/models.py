"""
SENTINEX v2.0 — Data Models
All Pydantic models for ThreatEvent, Incident, AgentState, RiskScore
"""
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
import uuid


# ═══════════════════════════════════════
# Enumerations
# ═══════════════════════════════════════

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class AgentStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    IDLE = "IDLE"
    ERROR = "ERROR"


# ═══════════════════════════════════════
# Core Event Model
# ═══════════════════════════════════════

class ThreatEvent(BaseModel):
    """Normalized security event from any data source."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source_ip: str
    destination_ip: str
    destination_port: int = 0
    protocol: str = "TCP"  # TCP | UDP | ICMP
    bytes_transferred: int = 0
    packet_count: int = 0
    duration_ms: float = 0.0
    event_type: str = "netflow"  # netflow | syslog | endpoint | cve
    raw_payload: Dict[str, Any] = {}
    source_feed: str = "zeek"  # zeek | wazuh | osquery | nvd
    geolocation: Optional[Dict[str, Any]] = None
    asset_criticality: str = "MEDIUM"  # CRITICAL | HIGH | MEDIUM | LOW
    tags: List[str] = []


# ═══════════════════════════════════════
# Agent Reasoning & Audit
# ═══════════════════════════════════════

class AgentReasoning(BaseModel):
    """Record of an agent's reasoning and actions."""
    agent_name: str
    reasoning: str
    confidence: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actions_taken: List[str] = []
    duration_ms: float = 0.0


class AuditLogEntry(BaseModel):
    """Timestamped agent action log entry."""
    agent: str
    action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = {}
    status: str = "SUCCESS"  # SUCCESS | FAILED | PENDING


# ═══════════════════════════════════════
# Kill Chain
# ═══════════════════════════════════════

class KillChainStage(BaseModel):
    """Single stage in an attack kill chain."""
    stage: str
    technique_id: str = ""
    technique_name: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    affected_asset: str = ""
    evidence: List[str] = []
    ioc: str = ""


class KillChain(BaseModel):
    """Complete attack kill chain reconstruction."""
    kill_chain_stages: List[KillChainStage] = []
    initial_access_vector: str = ""
    dwell_time_estimated_hours: float = 0.0
    data_exfiltrated: bool = False
    attacker_sophistication: str = "Cybercriminal"
    attribution_confidence: int = 0
    remediation_priority: List[str] = []


# ═══════════════════════════════════════
# Risk Score
# ═══════════════════════════════════════

class RiskScore(BaseModel):
    """CVSS 4.0-based risk score."""
    cvss_score: float = 0.0
    cvss_vector: str = ""
    business_impact: str = "LOW"  # CRITICAL | HIGH | MEDIUM | LOW
    business_impact_narrative: str = ""
    epss_estimate: float = 0.0


# ═══════════════════════════════════════
# Incident Model
# ═══════════════════════════════════════

class Incident(BaseModel):
    """Complete incident record with all agent findings."""
    incident_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: IncidentStatus = IncidentStatus.OPEN
    severity: Severity = Severity.MEDIUM
    title: str = ""
    description: str = ""

    # Source events
    triggering_events: List[str] = []  # ThreatEvent IDs
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None

    # MITRE ATT&CK
    mitre_techniques: List[str] = []
    mitre_tactic: str = ""

    # Agent findings
    threat_score: float = 0.0
    threat_type: str = ""
    agent_reasoning: List[AgentReasoning] = []
    evidence_chain: List[Dict[str, Any]] = []
    investigation_depth: int = 0

    # Response
    should_respond: bool = False
    response_actions: List[Dict[str, Any]] = []
    auto_contained: bool = False

    # Forensics
    kill_chain: Optional[KillChain] = None
    forensics_timeline: List[Dict[str, Any]] = []

    # Risk
    risk_score: Optional[RiskScore] = None
    cvss_score: float = 0.0

    # HITL
    hitl_required: bool = False
    assigned_analyst: Optional[str] = None

    # Audit
    audit_log: List[AuditLogEntry] = []

    # Assets
    affected_assets: List[str] = []
    iocs: List[str] = []


# ═══════════════════════════════════════
# Agent Status
# ═══════════════════════════════════════

class AgentStatus(BaseModel):
    """Health status of an individual agent."""
    agent_name: str
    status: AgentStatusEnum = AgentStatusEnum.IDLE
    last_run: Optional[datetime] = None
    events_processed: int = 0
    avg_latency_ms: float = 0.0
    error_count: int = 0


# ═══════════════════════════════════════
# WebSocket Message Types
# ═══════════════════════════════════════

class WSMessage(BaseModel):
    """WebSocket message envelope."""
    type: str  # NEW_EVENT | INCIDENT_CREATED | AGENT_STATE_UPDATE | RESPONSE_ACTION | HITL_REQUIRED
    data: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
