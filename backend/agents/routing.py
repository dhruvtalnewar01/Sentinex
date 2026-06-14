"""
SENTINEX v2.0 — Agent Routing
Conditional edge logic for the LangGraph StateGraph
"""
from typing import Literal
from backend.agents.state import AgentState
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("routing")
settings = get_settings()


def route_after_threat_hunter(state: AgentState) -> Literal["soc_analyst", "__end__"]:
    """
    After Threat Hunter:
    - If threat_score > threshold → route to SOC Analyst
    - If threat_score <= threshold → END (low noise, discard)
    """
    threat_score = state.get("threat_score", 0)
    threshold = settings.threat_score_threshold

    if threat_score > threshold:
        logger.info("routing_to_soc_analyst", threat_score=f"{threat_score:.3f}")
        return "soc_analyst"
    else:
        logger.info("routing_to_end_low_threat", threat_score=f"{threat_score:.3f}")
        return "__end__"


def route_after_soc_analyst(state: AgentState) -> Literal["soc_analyst", "incident_responder", "forensics_agent"]:
    """
    After SOC Analyst:
    - If investigation_depth < max AND confidence < threshold → self-loop
    - If should_respond == True → Incident Responder
    - If should_respond == False → Forensics Agent (skip response)
    """
    investigation_depth = state.get("investigation_depth", 0)
    confidence = state.get("confidence", 0)
    should_respond = state.get("should_respond", False)
    max_rounds = settings.soc_analyst_max_rounds
    confidence_threshold = settings.soc_analyst_confidence_threshold

    # Self-loop for deeper investigation
    if investigation_depth < max_rounds and confidence < confidence_threshold:
        logger.info(
            "routing_soc_analyst_self_loop",
            round=investigation_depth,
            confidence=confidence,
        )
        return "soc_analyst"

    # Route based on response decision
    if should_respond:
        logger.info("routing_to_incident_responder", confidence=confidence)
        return "incident_responder"
    else:
        logger.info("routing_to_forensics_no_response", confidence=confidence)
        return "forensics_agent"


def route_after_incident_responder(state: AgentState) -> Literal["forensics_agent"]:
    """
    After Incident Responder:
    - ALWAYS routes to Forensics Agent
    """
    logger.info("routing_to_forensics_post_response")
    return "forensics_agent"


def route_after_forensics(state: AgentState) -> Literal["risk_scorer"]:
    """
    After Forensics Agent:
    - ALWAYS routes to Risk Scorer
    """
    logger.info("routing_to_risk_scorer")
    return "risk_scorer"
