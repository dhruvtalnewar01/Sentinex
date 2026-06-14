"""
SENTINEX v2.0 — ML Models
IsolationForest anomaly detection + XGBoost threat classification
"""
import numpy as np
import os
import joblib
from typing import List, Tuple, Optional
from backend.core.logging import get_logger

logger = get_logger("ml_models")

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ═══════════════════════════════════════
# Feature extraction
# ═══════════════════════════════════════

FEATURE_NAMES = [
    "packet_rate", "byte_rate", "entropy", "duration_ms",
    "dst_port_variety", "protocol_encoded", "hour_of_day",
    "day_of_week", "src_reputation_score"
]

PROTOCOL_MAP = {"TCP": 0, "UDP": 1, "ICMP": 2}

THREAT_CLASSES = [
    "port_scan", "brute_force", "data_exfil", "lateral_move",
    "c2_beacon", "ddos", "web_exploit", "normal"
]


def extract_features(event: dict) -> np.ndarray:
    """Extract ML feature vector from a raw event."""
    duration = max(float(event.get("duration_ms", 1)), 1.0)
    packets = int(event.get("packet_count", event.get("packets", 1)))
    bytes_transferred = int(event.get("bytes_transferred", event.get("bytes_out", 0)))

    packet_rate = packets / (duration / 1000.0) if duration > 0 else 0
    byte_rate = bytes_transferred / (duration / 1000.0) if duration > 0 else 0

    # Entropy estimate from payload
    payload = str(event.get("payload", ""))
    if payload:
        chars = np.array([ord(c) for c in payload[:256]])
        if len(chars) > 0:
            _, counts = np.unique(chars, return_counts=True)
            probs = counts / len(chars)
            entropy = float(-np.sum(probs * np.log2(probs + 1e-10)))
        else:
            entropy = 0.0
    else:
        entropy = 0.0

    dst_port_variety = float(event.get("ports_scanned", event.get("dst_port_variety", 1)))
    protocol = PROTOCOL_MAP.get(event.get("protocol", "TCP"), 0)

    from datetime import datetime
    ts = event.get("timestamp", "")
    try:
        dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        hour = dt.hour
        day = dt.weekday()
    except (ValueError, TypeError):
        hour = 12
        day = 3

    # Reputation score (higher = more suspicious)
    reputation = 0.0
    if event.get("geolocation", {}).get("country") in ["RU", "CN", "KP", "IR"]:
        reputation = 0.7
    if event.get("failed_logins", 0) > 5:
        reputation = max(reputation, 0.8)
    if event.get("beacon_interval"):
        reputation = max(reputation, 0.6)
    if "sqli" in str(event.get("tags", [])):
        reputation = max(reputation, 0.9)

    return np.array([
        packet_rate, byte_rate, entropy, duration,
        dst_port_variety, float(protocol), float(hour),
        float(day), reputation
    ])


# ═══════════════════════════════════════
# IsolationForest Anomaly Detector
# ═══════════════════════════════════════

class AnomalyDetector:
    """IsolationForest-based anomaly detection."""

    def __init__(self):
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        model_path = os.path.join(MODEL_DIR, "isolation_forest.pkl")
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                logger.info("isolation_forest_loaded", path=model_path)
                return
            except Exception:
                pass
        self._train_on_synthetic()

    def _train_on_synthetic(self):
        """Train on synthetic normal traffic baseline."""
        from sklearn.ensemble import IsolationForest

        np.random.seed(42)
        n_samples = 10000

        # Generate realistic normal traffic patterns
        normal_data = np.column_stack([
            np.random.exponential(50, n_samples),        # packet_rate
            np.random.exponential(10000, n_samples),      # byte_rate
            np.random.uniform(2, 5, n_samples),           # entropy
            np.random.exponential(500, n_samples),        # duration_ms
            np.random.poisson(3, n_samples).astype(float),# dst_port_variety
            np.random.choice([0, 1, 2], n_samples, p=[0.7, 0.2, 0.1]).astype(float),  # protocol
            np.random.randint(0, 24, n_samples).astype(float),  # hour
            np.random.randint(0, 7, n_samples).astype(float),   # day
            np.random.uniform(0, 0.2, n_samples),        # reputation (low for normal)
        ])

        self.model = IsolationForest(
            contamination=0.1,
            n_estimators=200,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(normal_data)

        model_path = os.path.join(MODEL_DIR, "isolation_forest.pkl")
        joblib.dump(self.model, model_path)
        logger.info("isolation_forest_trained", samples=n_samples, path=model_path)

    def score(self, features: np.ndarray) -> float:
        """Compute anomaly score normalized to [0, 1]."""
        if self.model is None:
            return 0.5

        if features.ndim == 1:
            features = features.reshape(1, -1)

        raw_score = self.model.decision_function(features)[0]
        # Normalize: more negative = more anomalous → higher score
        normalized = float(np.clip((-raw_score + 0.5) * 1.2, 0, 1))
        return normalized

    def predict(self, features: np.ndarray) -> bool:
        """Predict if the event is anomalous."""
        if self.model is None:
            return False
        if features.ndim == 1:
            features = features.reshape(1, -1)
        return bool(self.model.predict(features)[0] == -1)


# ═══════════════════════════════════════
# XGBoost Threat Classifier
# ═══════════════════════════════════════

class ThreatClassifier:
    """XGBoost-based threat type classification."""

    def __init__(self):
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        model_path = os.path.join(MODEL_DIR, "xgb_classifier.pkl")
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                logger.info("xgb_classifier_loaded", path=model_path)
                return
            except Exception:
                pass
        self._train_on_synthetic()

    def _train_on_synthetic(self):
        """Train on synthetic labeled data."""
        try:
            from xgboost import XGBClassifier
        except ImportError:
            logger.warning("xgboost_not_installed")
            return

        np.random.seed(42)
        n_per_class = 1000
        X_all, y_all = [], []

        for label_idx, threat_type in enumerate(THREAT_CLASSES):
            X = self._generate_class_data(threat_type, n_per_class)
            X_all.append(X)
            y_all.extend([label_idx] * n_per_class)

        X_train = np.vstack(X_all)
        # Add threat_score as 10th feature
        threat_scores = np.random.uniform(0, 1, len(y_all))
        X_train = np.column_stack([X_train, threat_scores])
        y_train = np.array(y_all)

        self.model = XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric="mlogloss",
        )
        self.model.fit(X_train, y_train)

        model_path = os.path.join(MODEL_DIR, "xgb_classifier.pkl")
        joblib.dump(self.model, model_path)
        logger.info("xgb_classifier_trained", classes=len(THREAT_CLASSES), path=model_path)

    def _generate_class_data(self, threat_type: str, n: int) -> np.ndarray:
        """Generate synthetic features for a specific threat type."""
        base = np.random.randn(n, 9)

        if threat_type == "port_scan":
            base[:, 0] *= 200  # high packet rate
            base[:, 4] = np.random.uniform(20, 100, n)  # high port variety
            base[:, 8] = np.random.uniform(0.5, 1, n)  # high reputation
        elif threat_type == "brute_force":
            base[:, 0] *= 50
            base[:, 8] = np.random.uniform(0.6, 1, n)
        elif threat_type == "data_exfil":
            base[:, 1] = np.random.uniform(100000, 1000000, n)  # high byte rate
            base[:, 3] = np.random.uniform(5000, 30000, n)  # long duration
        elif threat_type == "lateral_move":
            base[:, 4] = np.random.uniform(2, 10, n)
            base[:, 8] = np.random.uniform(0.3, 0.7, n)
        elif threat_type == "c2_beacon":
            base[:, 0] = np.random.uniform(1, 10, n)  # low packet rate
            base[:, 1] = np.random.uniform(50, 500, n)  # low byte rate
        elif threat_type == "normal":
            base[:, 8] = np.random.uniform(0, 0.2, n)  # low reputation
        else:
            base[:, 8] = np.random.uniform(0.4, 0.9, n)

        return np.abs(base)

    def classify(self, features: np.ndarray, threat_score: float) -> Tuple[str, float]:
        """Classify the threat type and return confidence."""
        if self.model is None:
            return "normal", 0.5

        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Append threat_score as 10th feature
        X = np.column_stack([features, [threat_score]])
        pred = self.model.predict(X)[0]
        proba = float(self.model.predict_proba(X).max())

        return THREAT_CLASSES[int(pred)], proba


# ═══════════════════════════════════════
# Singleton instances
# ═══════════════════════════════════════

_anomaly_detector: Optional[AnomalyDetector] = None
_threat_classifier: Optional[ThreatClassifier] = None


def get_anomaly_detector() -> AnomalyDetector:
    global _anomaly_detector
    if _anomaly_detector is None:
        _anomaly_detector = AnomalyDetector()
    return _anomaly_detector


def get_threat_classifier() -> ThreatClassifier:
    global _threat_classifier
    if _threat_classifier is None:
        _threat_classifier = ThreatClassifier()
    return _threat_classifier
