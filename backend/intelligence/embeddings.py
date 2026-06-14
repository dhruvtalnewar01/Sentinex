"""
SENTINEX v2.0 — Embeddings
Sentence-transformers pipeline for incident similarity search
"""
from typing import List, Optional
from backend.core.logging import get_logger

logger = get_logger("embeddings")

_model = None


def get_embedding_model():
    """Lazy-load the sentence-transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("embeddings_model_loaded", model="all-MiniLM-L6-v2", dim=384)
        except ImportError:
            logger.warning("sentence_transformers_not_installed")
    return _model


def encode_text(text: str) -> Optional[List[float]]:
    """Encode a single text string to a 384-dim vector."""
    model = get_embedding_model()
    if model is None:
        return None
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def encode_texts(texts: List[str]) -> Optional[List[List[float]]]:
    """Batch encode multiple texts."""
    model = get_embedding_model()
    if model is None:
        return None
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return embeddings.tolist()
