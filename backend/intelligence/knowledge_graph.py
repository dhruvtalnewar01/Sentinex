"""
SENTINEX v2.0 — Knowledge Graph
Neo4j driver, schema creation, and entity ingestion for attack graph intelligence
"""
from typing import Dict, Any, List, Optional
from backend.core.logging import get_logger
from backend.core.config import get_settings

logger = get_logger("knowledge_graph")


class KnowledgeGraph:
    """Neo4j-backed knowledge graph for attack entity relationships."""

    def __init__(self):
        self.driver = None
        self._connect()

    def _connect(self):
        try:
            from neo4j import GraphDatabase
            settings = get_settings()
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self._init_schema()
            logger.info("neo4j_connected", uri=settings.neo4j_uri)
        except Exception as e:
            logger.warning("neo4j_connection_failed", error=str(e))
            self.driver = None

    def _init_schema(self):
        """Create indexes and constraints."""
        if not self.driver:
            return

        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (ip:IP) REQUIRE ip.address IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (c:CVE) REQUIRE c.cve_id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (t:MITRE_Technique) REQUIRE t.technique_id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Asset) REQUIRE a.asset_id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (i:Incident) REQUIRE i.incident_id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (ta:ThreatActor) REQUIRE ta.name IS UNIQUE",
        ]

        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception:
                    pass
        logger.info("neo4j_schema_initialized")

    def ingest_incident(self, incident: Dict[str, Any]):
        """Ingest an incident and its entities into the knowledge graph."""
        if not self.driver:
            return

        with self.driver.session() as session:
            # Create incident node
            session.run(
                """
                MERGE (i:Incident {incident_id: $incident_id})
                SET i.severity = $severity,
                    i.title = $title,
                    i.timestamp = $timestamp,
                    i.cvss_score = $cvss_score,
                    i.threat_type = $threat_type
                """,
                incident_id=incident.get("incident_id", ""),
                severity=incident.get("severity", "MEDIUM"),
                title=incident.get("title", ""),
                timestamp=str(incident.get("created_at", "")),
                cvss_score=incident.get("cvss_score", 0),
                threat_type=incident.get("threat_type", ""),
            )

            # Create IP nodes and relationships
            src_ip = incident.get("source_ip")
            if src_ip:
                session.run(
                    """
                    MERGE (ip:IP {address: $address})
                    WITH ip
                    MATCH (i:Incident {incident_id: $incident_id})
                    MERGE (ip)-[:ATTACKED]->(i)
                    """,
                    address=src_ip,
                    incident_id=incident.get("incident_id", ""),
                )

            # Create MITRE technique nodes
            for tech_id in incident.get("mitre_techniques", []):
                session.run(
                    """
                    MERGE (t:MITRE_Technique {technique_id: $tech_id})
                    WITH t
                    MATCH (i:Incident {incident_id: $incident_id})
                    MERGE (i)-[:USES]->(t)
                    """,
                    tech_id=tech_id,
                    incident_id=incident.get("incident_id", ""),
                )

            # Create asset nodes
            for asset in incident.get("affected_assets", []):
                session.run(
                    """
                    MERGE (a:Asset {asset_id: $asset_id})
                    WITH a
                    MATCH (i:Incident {incident_id: $incident_id})
                    MERGE (i)-[:TARGETS]->(a)
                    """,
                    asset_id=asset,
                    incident_id=incident.get("incident_id", ""),
                )

    def query_cypher(self, cypher: str, params: Optional[Dict] = None) -> List[Dict]:
        """Execute a parameterized Cypher query and return results."""
        if not self.driver:
            return []

        try:
            with self.driver.session() as session:
                result = session.run(cypher, **(params or {}))
                return [dict(record) for record in result]
        except Exception as e:
            logger.error("cypher_query_error", error=str(e), query=cypher[:100])
            return []

    def get_related_entities(self, ip: str) -> Dict[str, Any]:
        """Get all entities related to an IP address."""
        results = self.query_cypher(
            """
            MATCH (ip:IP {address: $address})-[r]->(n)
            RETURN type(r) as relationship, labels(n) as labels, properties(n) as props
            LIMIT 50
            """,
            {"address": ip}
        )
        return {"ip": ip, "relationships": results}

    def close(self):
        if self.driver:
            self.driver.close()


_knowledge_graph: Optional[KnowledgeGraph] = None


def get_knowledge_graph() -> KnowledgeGraph:
    global _knowledge_graph
    if _knowledge_graph is None:
        _knowledge_graph = KnowledgeGraph()
    return _knowledge_graph
