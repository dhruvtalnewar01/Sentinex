"""
SENTINEX v2.0 — Vector Store
ChromaDB initialization and operations for incident similarity search
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from backend.core.logging import get_logger

logger = get_logger("vector_store")


class VectorStore:
    """ChromaDB-backed vector store for incident embeddings."""

    def __init__(self):
        self.client = None
        self.collection = None
        self._init_store()

    def _init_store(self):
        try:
            import chromadb
            from backend.core.config import get_settings
            settings = get_settings()

            self.client = chromadb.HttpClient(
                host=settings.chromadb_host,
                port=settings.chromadb_port,
            )
            self.collection = self.client.get_or_create_collection(
                name="sentinex_incidents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("chromadb_connected", collection="sentinex_incidents")
        except Exception as e:
            logger.warning("chromadb_connection_failed", error=str(e))
            # Fallback to in-memory
            try:
                import chromadb
                self.client = chromadb.Client()
                self.collection = self.client.get_or_create_collection(
                    name="sentinex_incidents",
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info("chromadb_fallback_to_memory")
            except Exception:
                logger.warning("chromadb_not_available")

    def upsert_incident(self, incident_id: str, description: str,
                        metadata: Dict[str, Any], embedding: Optional[List[float]] = None):
        """Store an incident embedding with metadata."""
        if not self.collection:
            return

        try:
            meta = {
                "incident_id": incident_id,
                "severity": str(metadata.get("severity", "MEDIUM")),
                "timestamp": str(metadata.get("timestamp", datetime.utcnow().isoformat())),
                "attack_type": str(metadata.get("attack_type", "unknown")),
            }

            kwargs = {
                "ids": [incident_id],
                "documents": [description],
                "metadatas": [meta],
            }
            if embedding:
                kwargs["embeddings"] = [embedding]

            self.collection.upsert(**kwargs)
            logger.debug("incident_upserted", incident_id=incident_id)
        except Exception as e:
            logger.error("incident_upsert_error", error=str(e))

    def query_similar(self, query_text: str, top_k: int = 5,
                      embedding: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        """Query for similar past incidents."""
        if not self.collection:
            return []

        try:
            kwargs = {"n_results": top_k}
            if embedding:
                kwargs["query_embeddings"] = [embedding]
            else:
                kwargs["query_texts"] = [query_text]

            # Filter to last 90 days
            cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()
            kwargs["where"] = {"timestamp": {"$gte": cutoff}}

            results = self.collection.query(**kwargs)

            similar = []
            if results and results.get("documents"):
                for i, doc in enumerate(results["documents"][0]):
                    similar.append({
                        "document": doc,
                        "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                        "distance": results["distances"][0][i] if results.get("distances") else 0,
                    })
            return similar
        except Exception as e:
            logger.error("similarity_query_error", error=str(e))
            return []


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
