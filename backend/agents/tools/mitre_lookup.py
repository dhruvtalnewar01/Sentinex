"""
SENTINEX v2.0 — MITRE ATT&CK Lookup
Resolves MITRE technique IDs and maps threat types to ATT&CK framework
"""
from typing import Dict, List, Tuple, Optional

# ═══════════════════════════════════════
# MITRE ATT&CK Technique Database
# ═══════════════════════════════════════

MITRE_TECHNIQUES: Dict[str, Dict[str, str]] = {
    "T1190": {"name": "Exploit Public-Facing Application", "tactic": "Initial Access", "severity": "CRITICAL"},
    "T1078": {"name": "Valid Accounts", "tactic": "Defense Evasion", "severity": "HIGH"},
    "T1059": {"name": "Command and Scripting Interpreter", "tactic": "Execution", "severity": "HIGH"},
    "T1059.001": {"name": "PowerShell", "tactic": "Execution", "severity": "HIGH"},
    "T1053": {"name": "Scheduled Task/Job", "tactic": "Persistence", "severity": "MEDIUM"},
    "T1021": {"name": "Remote Services", "tactic": "Lateral Movement", "severity": "HIGH"},
    "T1021.001": {"name": "Remote Desktop Protocol", "tactic": "Lateral Movement", "severity": "HIGH"},
    "T1046": {"name": "Network Service Discovery", "tactic": "Discovery", "severity": "MEDIUM"},
    "T1110": {"name": "Brute Force", "tactic": "Credential Access", "severity": "HIGH"},
    "T1048": {"name": "Exfiltration Over Alternative Protocol", "tactic": "Exfiltration", "severity": "CRITICAL"},
    "T1071": {"name": "Application Layer Protocol", "tactic": "Command and Control", "severity": "HIGH"},
    "T1071.001": {"name": "Web Protocols", "tactic": "Command and Control", "severity": "HIGH"},
    "T1203": {"name": "Exploitation for Client Execution", "tactic": "Execution", "severity": "CRITICAL"},
    "T1486": {"name": "Data Encrypted for Impact", "tactic": "Impact", "severity": "CRITICAL"},
    "T1027": {"name": "Obfuscated Files or Information", "tactic": "Defense Evasion", "severity": "MEDIUM"},
    "T1055": {"name": "Process Injection", "tactic": "Defense Evasion", "severity": "HIGH"},
    "T1547": {"name": "Boot or Logon Autostart Execution", "tactic": "Persistence", "severity": "HIGH"},
    "T1003": {"name": "OS Credential Dumping", "tactic": "Credential Access", "severity": "CRITICAL"},
}

# Mapping from threat types to MITRE technique IDs
THREAT_TYPE_MAPPING: Dict[str, List[str]] = {
    "port_scan": ["T1046"],
    "brute_force": ["T1110"],
    "sql_injection": ["T1190"],
    "web_exploit": ["T1190", "T1203"],
    "lateral_move": ["T1021", "T1021.001"],
    "data_exfil": ["T1048"],
    "exfiltration": ["T1048"],
    "c2_beacon": ["T1071", "T1071.001"],
    "payload_exec": ["T1059", "T1059.001"],
    "backdoor": ["T1053", "T1547"],
    "credential_dump": ["T1003"],
    "ransomware": ["T1486"],
}


def lookup_technique(technique_id: str) -> Optional[Dict[str, str]]:
    """Look up a MITRE ATT&CK technique by ID."""
    return MITRE_TECHNIQUES.get(technique_id)


def get_techniques_for_threat(threat_type: str) -> List[str]:
    """Get MITRE technique IDs associated with a threat type."""
    return THREAT_TYPE_MAPPING.get(threat_type, [])


def get_technique_details(technique_ids: List[str]) -> List[Dict[str, str]]:
    """Get full details for a list of technique IDs."""
    details = []
    for tid in technique_ids:
        info = MITRE_TECHNIQUES.get(tid)
        if info:
            details.append({"technique_id": tid, **info})
    return details


def map_event_to_techniques(event: Dict) -> Tuple[List[str], str]:
    """Map a raw event to MITRE techniques and primary tactic."""
    tags = event.get("tags", [])
    event_type = event.get("event_type", "")
    techniques = []

    # Check tags for technique IDs
    for tag in tags:
        if tag.startswith("T") and tag in MITRE_TECHNIQUES:
            techniques.append(tag)

    # Check threat type mapping
    for threat_type, tech_ids in THREAT_TYPE_MAPPING.items():
        if threat_type in tags or threat_type == event_type:
            techniques.extend(tech_ids)

    techniques = list(set(techniques))

    # Determine primary tactic
    if techniques:
        primary = MITRE_TECHNIQUES.get(techniques[0], {})
        tactic = primary.get("tactic", "Unknown")
    else:
        tactic = "Unknown"

    return techniques, tactic
