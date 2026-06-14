"""
SENTINEX v2.0 — Agent State
TypedDict defining the shared state passed between all LangGraph agent nodes
"""
from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator


class AgentState(TypedDict):
    """Shared state schema for the LangGraph StateGraph."""

    # ── Input ──
    raw_event: Dict[str, Any]                          # Original ThreatEvent from Kafka

    # ── Threat Hunter Output ──
    threat_score: float                                 # 0.0–1.0 from IsolationForest
    threat_type: str                                    # Classified threat type
    mitre_techniques: List[str]                         # e.g. ["T1059.001", "T1078"]

    # ── SOC Analyst Output ──
    investigation_depth: int                            # 0–3 SOC analyst loop counter
    evidence_chain: List[Dict[str, Any]]                # Accumulated evidence per round
    confidence: float                                   # 0–100 analyst confidence

    # ── Incident Responder Gate ──
    should_respond: bool                                # Incident responder gate
    response_actions: List[str]                         # Actions taken (IP blocked, etc.)

    # ── Forensics Output ──
    kill_chain: Dict[str, Any]                          # Forensics kill chain reconstruction

    # ── Risk Scorer Output ──
    cvss_score: float                                   # Final CVSS 4.0 score
    cvss_vector: str                                    # CVSS vector string
    business_impact: str                                # CRITICAL | HIGH | MEDIUM | LOW
    business_impact_narrative: str                      # Executive summary

    # ── Human-in-the-Loop ──
    hitl_required: bool                                 # Flag for human review

    # ── Audit ──
    audit_log: Annotated[List[Dict[str, Any]], operator.add]  # Timestamped agent action log

    # ── Metadata ──
    incident_id: str                                    # Generated incident ID
    incident_title: str                                 # Generated title
    incident_severity: str                              # CRITICAL | HIGH | MEDIUM | LOW
