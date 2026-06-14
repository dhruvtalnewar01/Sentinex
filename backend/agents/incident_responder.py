"""
SENTINEX v2.0 — Incident Responder Agent (Node 3)
Autonomous remediation: IP blocking + playbook execution
"""
from datetime import datetime
from typing import Dict, Any, List
from backend.agents.state import AgentState
from backend.agents.tools.ip_blocker import block_ip
from backend.agents.tools.playbook_executor import execute_playbook, get_playbook_for_tactic
from backend.agents.tools.mitre_lookup import lookup_technique
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("agent.incident_responder")
settings = get_settings()


async def incident_responder_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 3: Incident Responder
    - ONLY executes if should_respond == True
    - Blocks malicious IPs via firewall API
    - Executes response playbooks via ansible-runner wrapper
    - Sets hitl_required if any action has high irreversibility
    """
    raw_event = state["raw_event"]
    start_time = datetime.utcnow()
    response_actions: List[str] = []
    hitl_required = False

    src_ip = raw_event.get("src_ip", raw_event.get("source_ip", ""))
    incident_title = state.get("incident_title", "")

    # 1. Block source IP
    if src_ip and not src_ip.startswith("10."):
        try:
            result = await block_ip(src_ip, reason=incident_title, source="incident_responder")
            response_actions.append(f"BLOCKED_IP:{src_ip} → {result.get('status')}")
        except Exception as e:
            response_actions.append(f"BLOCKED_IP:{src_ip} → FAILED: {str(e)}")
            logger.error("ip_block_failed", ip=src_ip, error=str(e))

    # 2. Block IOCs from evidence chain
    evidence_chain = state.get("evidence_chain", [])
    iocs_blocked = set()
    for evidence in evidence_chain:
        for ioc in evidence.get("iocs", []):
            if ioc not in iocs_blocked and "." in ioc:
                try:
                    result = await block_ip(ioc, reason="IOC from SOC Analyst", source="incident_responder")
                    response_actions.append(f"BLOCKED_IOC:{ioc} → {result.get('status')}")
                    iocs_blocked.add(ioc)
                except Exception as e:
                    response_actions.append(f"BLOCKED_IOC:{ioc} → FAILED: {str(e)}")

    # 3. Execute response playbook based on MITRE tactic
    mitre_techniques = state.get("mitre_techniques", [])
    primary_tactic = "Unknown"
    for tech_id in mitre_techniques:
        info = lookup_technique(tech_id)
        if info:
            primary_tactic = info.get("tactic", "Unknown")
            break

    playbook_name = get_playbook_for_tactic(primary_tactic)
    try:
        playbook_result = await execute_playbook(playbook_name, context={
            "incident_id": state.get("incident_id", ""),
            "source_ip": src_ip,
            "mitre_techniques": mitre_techniques,
        })
        response_actions.extend([f"PLAYBOOK:{a}" for a in playbook_result.get("steps_executed", [])])

        # Check irreversibility for HITL
        if playbook_result.get("max_irreversibility", 0) > settings.hitl_irreversibility_threshold:
            hitl_required = True
    except Exception as e:
        response_actions.append(f"PLAYBOOK:{playbook_name} → FAILED: {str(e)}")
        logger.error("playbook_execution_failed", playbook=playbook_name, error=str(e))

    elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
    logger.info(
        "incident_responder_complete",
        actions_taken=len(response_actions),
        hitl_required=hitl_required,
        playbook=playbook_name,
        elapsed_ms=f"{elapsed:.1f}",
    )

    return {
        "response_actions": response_actions,
        "hitl_required": hitl_required,
        "audit_log": [{
            "agent": "incident_responder",
            "action": "autonomous_response",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "actions_taken": response_actions,
                "playbook": playbook_name,
                "hitl_required": hitl_required,
                "ips_blocked": list(iocs_blocked) + ([src_ip] if src_ip else []),
            },
            "duration_ms": elapsed,
        }],
    }
