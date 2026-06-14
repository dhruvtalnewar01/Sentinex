"""
SENTINEX v2.0 — Threat Hunter Agent (Node 1)
IsolationForest anomaly detection + MITRE ATT&CK mapping
"""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any
from backend.agents.state import AgentState
from backend.agents.tools.mitre_lookup import get_techniques_for_threat, map_event_to_techniques
from backend.intelligence.ml_models import extract_features, get_anomaly_detector, get_threat_classifier
from backend.core.logging import get_logger

logger = get_logger("agent.threat_hunter")


async def threat_hunter_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 1: Threat Hunter
    - Runs IsolationForest anomaly detection
    - Classifies threat type via XGBoost
    - Maps to MITRE ATT&CK techniques
    - Appends to audit_log
    """
    raw_event = state["raw_event"]
    start_time = datetime.utcnow()

    # Extract features from the raw event
    try:
        features = extract_features(raw_event)
    except Exception as e:
        logger.error("feature_extraction_failed", error=str(e))
        features = None

    # Run IsolationForest anomaly detection
    threat_score = 0.0
    is_anomalous = False
    if features is not None:
        try:
            detector = get_anomaly_detector()
            # Run in thread pool to avoid blocking event loop
            loop = asyncio.get_event_loop()
            threat_score = await loop.run_in_executor(None, detector.score, features)
            is_anomalous = await loop.run_in_executor(None, detector.predict, features)
        except Exception as e:
            logger.error("anomaly_detection_failed", error=str(e))
            # Fallback: use heuristic scoring
            threat_score = _heuristic_score(raw_event)
            is_anomalous = threat_score > 0.5

    # Classify threat type
    threat_type = "normal"
    if is_anomalous and features is not None:
        try:
            classifier = get_threat_classifier()
            loop = asyncio.get_event_loop()
            threat_type, _ = await loop.run_in_executor(
                None, classifier.classify, features, threat_score
            )
        except Exception:
            threat_type = _heuristic_classify(raw_event)

    # Map to MITRE ATT&CK
    mitre_techniques = []
    if threat_score > 0.3:
        # From threat type
        mitre_techniques = get_techniques_for_threat(threat_type)
        # Also from event tags
        event_techniques, _ = map_event_to_techniques(raw_event)
        mitre_techniques = list(set(mitre_techniques + event_techniques))

    # Generate incident metadata
    severity = "LOW"
    if threat_score > 0.85:
        severity = "CRITICAL"
    elif threat_score > 0.7:
        severity = "HIGH"
    elif threat_score > 0.55:
        severity = "MEDIUM"

    elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000

    logger.info(
        "threat_hunter_complete",
        threat_score=f"{threat_score:.3f}",
        threat_type=threat_type,
        mitre_techniques=mitre_techniques,
        severity=severity,
        elapsed_ms=f"{elapsed:.1f}",
    )

    return {
        "threat_score": threat_score,
        "threat_type": threat_type,
        "mitre_techniques": mitre_techniques,
        "incident_id": str(uuid.uuid4()),
        "incident_title": f"[{severity}] {threat_type.replace('_', ' ').title()} — {raw_event.get('src_ip', 'Unknown')}",
        "incident_severity": severity,
        "audit_log": [{
            "agent": "threat_hunter",
            "action": "anomaly_detection",
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "threat_score": threat_score,
                "threat_type": threat_type,
                "mitre_techniques": mitre_techniques,
                "is_anomalous": is_anomalous,
            },
            "duration_ms": elapsed,
        }],
    }


def _heuristic_score(event: Dict[str, Any]) -> float:
    """Fallback heuristic scoring when ML models aren't available."""
    score = 0.0
    tags = event.get("tags", [])

    if any(t in tags for t in ["sqli", "T1190", "initial_access"]):
        score = max(score, 0.85)
    if any(t in tags for t in ["lateral_movement", "T1021"]):
        score = max(score, 0.78)
    if any(t in tags for t in ["exfiltration", "T1048"]):
        score = max(score, 0.9)
    if any(t in tags for t in ["c2", "beacon", "T1071"]):
        score = max(score, 0.75)
    if any(t in tags for t in ["brute_force", "T1110"]):
        score = max(score, 0.7)
    if any(t in tags for t in ["recon", "port_scan"]):
        score = max(score, 0.6)
    if event.get("ports_scanned", 0) > 20:
        score = max(score, 0.65)
    if event.get("failed_logins", 0) > 10:
        score = max(score, 0.72)
    if event.get("bytes_out", 0) > 50_000_000:
        score = max(score, 0.88)
    if event.get("beacon_interval"):
        score = max(score, 0.7)
    if event.get("geolocation", {}).get("country") in ["RU", "CN", "KP", "IR"]:
        score += 0.1

    return min(score, 1.0)


def _heuristic_classify(event: Dict[str, Any]) -> str:
    """Fallback heuristic classification."""
    tags = str(event.get("tags", []))
    payload = str(event.get("payload", "")).lower()

    if "sql" in tags or "' or" in payload or "union select" in payload:
        return "web_exploit"
    if "brute" in tags or event.get("failed_logins", 0) > 10:
        return "brute_force"
    if "port_scan" in tags or event.get("ports_scanned", 0) > 20:
        return "port_scan"
    if "exfil" in tags or event.get("bytes_out", 0) > 50_000_000:
        return "data_exfil"
    if "c2" in tags or event.get("beacon_interval"):
        return "c2_beacon"
    if "lateral" in tags:
        return "lateral_move"

    return "lateral_move"
