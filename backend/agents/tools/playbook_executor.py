"""
SENTINEX v2.0 — Playbook Executor
Ansible-runner wrapper for automated response playbooks
"""
from typing import Dict, Any, List
from datetime import datetime
from backend.core.logging import get_logger

logger = get_logger("playbook_executor")

# ═══════════════════════════════════════
# Playbook Definitions
# ═══════════════════════════════════════

PLAYBOOKS: Dict[str, Dict[str, Any]] = {
    "generic_containment": {
        "name": "Generic Containment",
        "steps": [
            {"action": "BLOCK_OUTBOUND_C2_PORTS", "irreversibility": 0.3},
            {"action": "ISOLATE_INFECTED_HOST", "irreversibility": 0.7},
            {"action": "CAPTURE_MEMORY_DUMP", "irreversibility": 0.1},
            {"action": "NOTIFY_SECURITY_TEAM", "irreversibility": 0.0},
        ],
    },
    "isolate_and_patch": {
        "name": "Isolate and Patch",
        "steps": [
            {"action": "QUARANTINE_HOST", "irreversibility": 0.8},
            {"action": "REVOKE_ACTIVE_SESSIONS", "irreversibility": 0.6},
            {"action": "TRIGGER_PATCH_DEPLOYMENT", "irreversibility": 0.4},
            {"action": "FORCE_MFA_REENROLLMENT", "irreversibility": 0.5},
        ],
    },
    "network_segmentation": {
        "name": "Network Segmentation",
        "steps": [
            {"action": "ISOLATE_NETWORK_SEGMENT", "irreversibility": 0.9},
            {"action": "BLOCK_LATERAL_MOVEMENT_PORTS", "irreversibility": 0.5},
            {"action": "ENABLE_ENHANCED_MONITORING", "irreversibility": 0.1},
            {"action": "NOTIFY_NETWORK_TEAM", "irreversibility": 0.0},
        ],
    },
    "egress_lockdown": {
        "name": "Egress Lockdown",
        "steps": [
            {"action": "BLOCK_ALL_EGRESS_FROM_HOST", "irreversibility": 0.85},
            {"action": "INSPECT_DLP_LOGS", "irreversibility": 0.1},
            {"action": "NOTIFY_DATA_OFFICER", "irreversibility": 0.0},
            {"action": "CREATE_FORENSIC_IMAGE", "irreversibility": 0.1},
        ],
    },
    "c2_disruption": {
        "name": "C2 Disruption",
        "steps": [
            {"action": "BLOCK_C2_DOMAINS_DNS", "irreversibility": 0.4},
            {"action": "SINKHOLE_C2_IPS", "irreversibility": 0.5},
            {"action": "KILL_SUSPICIOUS_PROCESSES", "irreversibility": 0.7},
            {"action": "CAPTURE_NETWORK_TRACE", "irreversibility": 0.1},
        ],
    },
    "force_password_reset": {
        "name": "Force Password Reset",
        "steps": [
            {"action": "FORCE_PASSWORD_RESET_ALL_AFFECTED", "irreversibility": 0.6},
            {"action": "REVOKE_API_TOKENS", "irreversibility": 0.7},
            {"action": "ENABLE_MFA_ENFORCEMENT", "irreversibility": 0.3},
            {"action": "AUDIT_PRIVILEGED_ACCOUNTS", "irreversibility": 0.1},
        ],
    },
}

# Mapping from MITRE tactics to playbooks
TACTIC_PLAYBOOK_MAP = {
    "Initial Access": "isolate_and_patch",
    "Execution": "generic_containment",
    "Persistence": "generic_containment",
    "Lateral Movement": "network_segmentation",
    "Exfiltration": "egress_lockdown",
    "Command and Control": "c2_disruption",
    "Credential Access": "force_password_reset",
    "Discovery": "generic_containment",
    "Defense Evasion": "generic_containment",
    "Impact": "isolate_and_patch",
}


async def execute_playbook(playbook_name: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute a response playbook and return results."""
    playbook = PLAYBOOKS.get(playbook_name, PLAYBOOKS["generic_containment"])
    results = {
        "playbook": playbook_name,
        "playbook_display_name": playbook["name"],
        "steps_executed": [],
        "steps_failed": [],
        "max_irreversibility": 0.0,
        "success": True,
        "executed_at": datetime.utcnow().isoformat(),
    }

    for step in playbook["steps"]:
        try:
            # Simulate step execution
            results["steps_executed"].append(step["action"])
            results["max_irreversibility"] = max(
                results["max_irreversibility"], step["irreversibility"]
            )
            logger.info("playbook_step_executed", playbook=playbook_name, action=step["action"])
        except Exception as e:
            results["steps_failed"].append({"action": step["action"], "error": str(e)})
            results["success"] = False
            logger.error("playbook_step_failed", playbook=playbook_name, action=step["action"], error=str(e))

    return results


def get_playbook_for_tactic(tactic: str) -> str:
    """Select the appropriate playbook based on MITRE tactic."""
    return TACTIC_PLAYBOOK_MAP.get(tactic, "generic_containment")
