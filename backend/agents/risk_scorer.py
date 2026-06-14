"""
SENTINEX v2.0 — Risk Scorer Agent (Node 5 — TERMINAL)
CVSS 4.0 scoring + business impact assessment
"""
import json
from datetime import datetime
from typing import Dict, Any
from backend.agents.state import AgentState
from backend.agents.tools.mitre_lookup import lookup_technique
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("agent.risk_scorer")
settings = get_settings()


async def risk_scorer_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 5: Risk Scorer (TERMINAL NODE)
    - Computes CVSS 4.0 score from multiple factors
    - Generates business impact narrative via Claude
    - Sets business_impact classification
    - Always runs last → END
    """
    start_time = datetime.utcnow()
    raw_event = state["raw_event"]
    threat_score = state.get("threat_score", 0)
    investigation_depth = state.get("investigation_depth", 0)
    mitre_techniques = state.get("mitre_techniques", [])
    response_actions = state.get("response_actions", [])
    kill_chain = state.get("kill_chain", {})

    # ── CVSS 4.0 Base Score Computation ──
    # Attack Vector (AV)
    src_ip = raw_event.get("src_ip", raw_event.get("source_ip", ""))
    if src_ip.startswith("10.") or src_ip.startswith("192.168."):
        av_score = 0.55  # Adjacent
    else:
        av_score = 0.85  # Network

    # Attack Complexity (AC)
    ac_score = 0.77 if investigation_depth <= 1 else 0.44  # Low if complex investigation

    # Privileges Required (PR)
    has_priv_escalation = any(
        lookup_technique(t) and "Credential" in (lookup_technique(t) or {}).get("tactic", "")
        for t in mitre_techniques
    )
    pr_score = 0.85 if not has_priv_escalation else 0.62

    # User Interaction (UI)
    ui_score = 0.85  # None required for most automated attacks

    # Impact scores based on asset criticality
    asset_crit = raw_event.get("asset_criticality", "MEDIUM")
    impact_map = {"CRITICAL": 0.56, "HIGH": 0.42, "MEDIUM": 0.27, "LOW": 0.12}
    impact_score = impact_map.get(asset_crit, 0.27)

    # Composite CVSS score
    exploitability = 8.22 * av_score * ac_score * pr_score * ui_score
    impact_subscore = 6.42 * impact_score * 3

    # Adjust based on threat intelligence
    ti_bonus = min(threat_score * 2, 2.0)
    auto_contained_reduction = -1.5 if len(response_actions) > 0 else 0

    cvss_score = min(10.0, exploitability + impact_subscore + ti_bonus + auto_contained_reduction)
    cvss_score = max(0.0, round(cvss_score, 1))

    # CVSS Vector String
    av_str = "N" if av_score > 0.7 else "A"
    ac_str = "L" if ac_score > 0.5 else "H"
    pr_str = "N" if pr_score > 0.7 else "L"
    ui_str = "N" if ui_score > 0.7 else "R"
    cvss_vector = f"CVSS:4.0/AV:{av_str}/AC:{ac_str}/PR:{pr_str}/UI:{ui_str}"

    # Business Impact Classification
    if cvss_score >= 9.0:
        business_impact = "CRITICAL"
    elif cvss_score >= 7.0:
        business_impact = "HIGH"
    elif cvss_score >= 4.0:
        business_impact = "MEDIUM"
    else:
        business_impact = "LOW"

    # Generate business impact narrative
    narrative = ""
    try:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=200,
            temperature=0.3,
            system="You are an executive cybersecurity advisor. Provide a 2-sentence business impact summary.",
            messages=[{
                "role": "user",
                "content": f"CVSS score: {cvss_score}, threat type: {state.get('threat_type', '')}, "
                           f"affected assets: {raw_event.get('dst_ip', '')}, "
                           f"kill chain stages: {len(kill_chain.get('kill_chain_stages', []))}, "
                           f"data exfiltrated: {kill_chain.get('data_exfiltrated', False)}. "
                           f"Provide a 2-sentence executive business impact summary."
            }],
        )
        narrative = response.content[0].text.strip()
    except Exception as e:
        logger.warning("narrative_generation_failed", error=str(e))
        narrative = _fallback_narrative(cvss_score, state)

    elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
    logger.info(
        "risk_scorer_complete",
        cvss_score=cvss_score,
        cvss_vector=cvss_vector,
        business_impact=business_impact,
        elapsed_ms=f"{elapsed:.1f}",
    )

    return {
        "cvss_score": cvss_score,
        "cvss_vector": cvss_vector,
        "business_impact": business_impact,
        "business_impact_narrative": narrative,
        "audit_log": [{
            "agent": "risk_scorer",
            "action": "cvss_scoring",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "cvss_score": cvss_score,
                "cvss_vector": cvss_vector,
                "business_impact": business_impact,
                "components": {
                    "av": av_score, "ac": ac_score,
                    "pr": pr_score, "ui": ui_score,
                    "impact": impact_score,
                },
            },
            "duration_ms": elapsed,
        }],
    }


def _fallback_narrative(cvss_score: float, state: AgentState) -> str:
    """Generate narrative without Claude."""
    threat_type = state.get("threat_type", "unknown threat")
    kill_chain = state.get("kill_chain", {})

    if cvss_score >= 9.0:
        return (
            f"CRITICAL: Active {threat_type.replace('_', ' ')} attack detected with CVSS {cvss_score}/10. "
            f"Potential data exfiltration from financial records database affecting business continuity and regulatory compliance."
        )
    elif cvss_score >= 7.0:
        return (
            f"HIGH: Significant {threat_type.replace('_', ' ')} activity with CVSS {cvss_score}/10. "
            f"Compromised systems may lead to lateral movement and data exposure. Immediate executive notification recommended."
        )
    elif cvss_score >= 4.0:
        return (
            f"MEDIUM: Suspicious {threat_type.replace('_', ' ')} behavior with CVSS {cvss_score}/10. "
            f"Monitoring recommended; autonomous containment measures have been applied."
        )
    else:
        return (
            f"LOW: Minor {threat_type.replace('_', ' ')} activity with CVSS {cvss_score}/10. "
            f"Event logged for trend analysis. No immediate business impact expected."
        )
