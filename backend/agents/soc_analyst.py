"""
SENTINEX v2.0 — SOC Analyst Agent (Node 2)
Claude Sonnet 4 deep reasoning with self-loop investigation
"""
import json
from datetime import datetime
from typing import Dict, Any
from backend.agents.state import AgentState
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("agent.soc_analyst")
settings = get_settings()

SOC_ANALYST_SYSTEM_PROMPT = """You are SENTINEL-SOC, an expert cybersecurity analyst with deep knowledge of MITRE ATT&CK, threat hunting, and incident response.

You receive security telemetry events and must analyze them with precision. You have access to:
- Historical similar incidents (provided in context)
- Related entity relationships from our knowledge graph
- MITRE technique mappings from the threat hunter

Your analysis MUST follow this exact JSON schema:
{
  "classification": "string (e.g. 'Lateral Movement - Pass the Hash')",
  "confidence": 0-100,
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "attack_stage": "Initial Access|Execution|Persistence|Privilege Escalation|Defense Evasion|Credential Access|Discovery|Lateral Movement|Collection|Exfiltration|Command and Control|Impact",
  "affected_assets": ["string"],
  "indicators_of_compromise": ["string"],
  "additional_evidence_needed": ["string"] or null,
  "should_respond_autonomously": boolean,
  "reasoning": "string (2-3 sentences max)",
  "recommended_actions": ["string"]
}

Be decisive. If confidence > 85, recommend autonomous response.
If confidence < 85 and there is additional evidence to gather, request another investigation round. Maximum 3 rounds."""


async def soc_analyst_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 2: SOC Analyst
    - Retrieves similar past incidents via ChromaDB
    - Queries Neo4j for related entities
    - Calls Claude Sonnet 4 for deep reasoning
    - Self-loops up to 3 times if confidence < 85
    """
    raw_event = state["raw_event"]
    start_time = datetime.utcnow()
    investigation_depth = state.get("investigation_depth", 0)
    evidence_chain = list(state.get("evidence_chain", []))

    # Build investigation context
    context_parts = [
        f"THREAT SCORE: {state.get('threat_score', 0):.3f}",
        f"THREAT TYPE: {state.get('threat_type', 'unknown')}",
        f"MITRE TECHNIQUES: {', '.join(state.get('mitre_techniques', []))}",
        f"SOURCE IP: {raw_event.get('src_ip', raw_event.get('source_ip', 'unknown'))}",
        f"DESTINATION IP: {raw_event.get('dst_ip', raw_event.get('destination_ip', 'unknown'))}",
        f"EVENT TYPE: {raw_event.get('event_type', 'unknown')}",
        f"INVESTIGATION ROUND: {investigation_depth + 1}/3",
    ]

    if raw_event.get("geolocation"):
        context_parts.append(f"GEOLOCATION: {json.dumps(raw_event['geolocation'])}")

    if evidence_chain:
        context_parts.append(f"PREVIOUS EVIDENCE CHAIN: {json.dumps(evidence_chain[-2:], default=str)}")

    # Try to get similar incidents from ChromaDB
    similar_incidents = []
    try:
        from backend.intelligence.vector_store import get_vector_store
        vs = get_vector_store()
        similar_incidents = vs.query_similar(
            f"{state.get('threat_type', '')} {raw_event.get('event_type', '')} attack",
            top_k=5,
        )
        if similar_incidents:
            context_parts.append(f"SIMILAR PAST INCIDENTS: {json.dumps(similar_incidents[:3], default=str)}")
    except Exception:
        pass

    human_msg = "\n".join(context_parts) + f"\n\nRAW EVENT:\n{json.dumps(raw_event, indent=2, default=str)}"

    # Call Claude Sonnet 4
    analysis = None
    try:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1500,
            temperature=0.1,
            system=SOC_ANALYST_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": human_msg}],
        )
        raw_response = response.content[0].text.strip()

        # Parse JSON from response
        if raw_response.startswith("```"):
            raw_response = "\n".join(raw_response.split("\n")[1:-1])
        analysis = json.loads(raw_response)
        logger.info("claude_analysis_received", confidence=analysis.get("confidence"))

    except Exception as e:
        logger.warning("claude_call_failed", error=str(e), fallback="heuristic")
        analysis = _fallback_analysis(state)

    # Extract results
    confidence = float(analysis.get("confidence", 70))
    should_respond = bool(
        analysis.get("should_respond_autonomously", False)
        and confidence >= settings.soc_analyst_confidence_threshold
    )

    # Append to evidence chain
    evidence_entry = {
        "round": investigation_depth + 1,
        "timestamp": datetime.utcnow().isoformat(),
        "classification": analysis.get("classification", "Unknown"),
        "confidence": confidence,
        "reasoning": analysis.get("reasoning", ""),
        "attack_stage": analysis.get("attack_stage", ""),
        "iocs": analysis.get("indicators_of_compromise", []),
        "recommended_actions": analysis.get("recommended_actions", []),
    }
    evidence_chain.append(evidence_entry)

    # Determine severity from analysis
    analysis_severity = analysis.get("severity", state.get("incident_severity", "MEDIUM"))

    elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
    logger.info(
        "soc_analyst_complete",
        round=investigation_depth + 1,
        confidence=confidence,
        should_respond=should_respond,
        classification=analysis.get("classification"),
        elapsed_ms=f"{elapsed:.1f}",
    )

    return {
        "investigation_depth": investigation_depth + 1,
        "evidence_chain": evidence_chain,
        "confidence": confidence,
        "should_respond": should_respond,
        "incident_severity": analysis_severity,
        "incident_title": f"[{analysis_severity}] {analysis.get('classification', state.get('incident_title', 'Unknown Threat'))}",
        "audit_log": [{
            "agent": "soc_analyst",
            "action": f"investigation_round_{investigation_depth + 1}",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "confidence": confidence,
                "classification": analysis.get("classification"),
                "should_respond": should_respond,
                "attack_stage": analysis.get("attack_stage"),
                "affected_assets": analysis.get("affected_assets", []),
            },
            "duration_ms": elapsed,
        }],
    }


def _fallback_analysis(state: AgentState) -> Dict[str, Any]:
    """Heuristic fallback when Claude is unavailable."""
    threat_score = state.get("threat_score", 0)
    threat_type = state.get("threat_type", "unknown")
    raw_event = state.get("raw_event", {})

    confidence = min(95, int(threat_score * 100) + 10)
    severity = "CRITICAL" if threat_score > 0.85 else "HIGH" if threat_score > 0.7 else "MEDIUM"

    classification_map = {
        "port_scan": "Network Reconnaissance - Port Scanning",
        "brute_force": "Credential Access - Brute Force Attack",
        "web_exploit": "Initial Access - Web Application Exploit",
        "sql_injection": "Initial Access - SQL Injection",
        "lateral_move": "Lateral Movement - Remote Service Exploitation",
        "data_exfil": "Exfiltration - Data Transfer to External Host",
        "c2_beacon": "Command and Control - Periodic Beacon",
    }

    src_ip = raw_event.get("src_ip", raw_event.get("source_ip", "unknown"))

    return {
        "classification": classification_map.get(threat_type, f"Suspicious Activity - {threat_type}"),
        "confidence": confidence,
        "severity": severity,
        "attack_stage": "Lateral Movement" if "lateral" in threat_type else "Initial Access",
        "affected_assets": [raw_event.get("dst_ip", raw_event.get("destination_ip", "unknown"))],
        "indicators_of_compromise": [src_ip],
        "additional_evidence_needed": None if confidence >= 85 else ["Network flow analysis", "Endpoint logs"],
        "should_respond_autonomously": confidence >= 85 and severity in ["CRITICAL", "HIGH"],
        "reasoning": f"Automated analysis detected {threat_type.replace('_', ' ')} pattern with anomaly score {threat_score:.3f}. "
                     f"Source IP {src_ip} exhibits behavior consistent with APT-level threat activity.",
        "recommended_actions": ["Block source IP", "Isolate affected hosts", "Capture forensic image"],
    }
