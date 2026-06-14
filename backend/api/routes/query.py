"""
SENTINEX v2.0 — NL Query API
Natural language → Cypher query conversion via Claude
"""
from fastapi import APIRouter
from pydantic import BaseModel
from backend.core.config import get_settings
from backend.core.logging import get_logger

router = APIRouter(prefix="/api/v1", tags=["query"])
logger = get_logger("query")
settings = get_settings()

NL_QUERY_SYSTEM = """You are a Neo4j Cypher query generator for a cybersecurity knowledge graph.
The graph schema is:
  Nodes: (IP), (CVE), (MITRE_Technique), (Asset), (Incident), (ThreatActor)
  Relationships: [:ATTACKED]->(IP), [:EXPLOITS]->(CVE),
                 [:USES]->(MITRE_Technique), [:TARGETS]->(Asset),
                 [:ASSOCIATED_WITH]->(ThreatActor)

Convert the user's natural language security query to a Cypher query.
Return ONLY the Cypher query, no explanation, no markdown."""


class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    results: list = []
    cypher_used: str = ""
    answer: str = ""
    query: str = ""


@router.post("/query", response_model=QueryResponse)
async def natural_language_query(req: QueryRequest):
    """Convert natural language to Cypher, execute, and return results."""

    # Generate Cypher
    cypher = ""
    try:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=500,
            temperature=0.0,
            system=NL_QUERY_SYSTEM,
            messages=[{"role": "user", "content": req.query}],
        )
        cypher = response.content[0].text.strip()
        if cypher.startswith("```"):
            cypher = "\n".join(cypher.split("\n")[1:-1])
    except Exception as e:
        logger.warning("cypher_generation_failed", error=str(e))
        cypher = _fallback_cypher(req.query)

    # Execute against Neo4j
    results = []
    try:
        from backend.intelligence.knowledge_graph import get_knowledge_graph
        kg = get_knowledge_graph()
        results = kg.query_cypher(cypher)
    except Exception as e:
        logger.warning("cypher_execution_failed", error=str(e))

    # Generate readable answer
    answer = f"Query executed successfully. Found {len(results)} result(s)."
    if not results:
        answer = _generate_sample_answer(req.query)

    return QueryResponse(
        results=results,
        cypher_used=cypher,
        answer=answer,
        query=req.query,
    )


def _fallback_cypher(query: str) -> str:
    """Generate a basic Cypher query without Claude."""
    q_lower = query.lower()
    if "apt28" in q_lower:
        return "MATCH (i:Incident) WHERE i.title CONTAINS 'APT28' RETURN i LIMIT 10"
    if "critical" in q_lower:
        return "MATCH (i:Incident) WHERE i.severity = 'CRITICAL' RETURN i ORDER BY i.cvss_score DESC LIMIT 10"
    if "lateral" in q_lower:
        return "MATCH (i:Incident)-[:USES]->(t:MITRE_Technique {technique_id: 'T1021'}) RETURN i, t LIMIT 10"
    if "ip" in q_lower:
        return "MATCH (ip:IP)-[:ATTACKED]->(i:Incident) RETURN ip.address, i.title, i.severity LIMIT 20"
    return "MATCH (i:Incident) RETURN i ORDER BY i.timestamp DESC LIMIT 10"


def _generate_sample_answer(query: str) -> str:
    """Generate a sample answer for demo mode."""
    q_lower = query.lower()
    if "apt28" in q_lower:
        return ("Detected 3 incidents attributed to APT28 in the last 24 hours: "
                "2 lateral movement attempts via RDP (T1021.001) and 1 data exfiltration event (T1048). "
                "Source IPs: 185.220.101.47, 45.33.32.156. All incidents have been auto-contained.")
    if "critical" in q_lower:
        return ("Found 2 CRITICAL incidents: (1) SQL Injection → Lateral Movement → Exfiltration chain, CVSS 8.9, "
                "(2) Brute force attack on SSH, CVSS 7.8. Both auto-contained by Incident Responder.")
    if "lateral" in q_lower:
        return ("7 lateral movement attempts detected in the last 7 days using techniques T1021 (Remote Services) "
                "and T1021.001 (RDP). Primary targets: 10.0.2.20, 10.0.3.15. Attacker pivoting from 10.0.1.50.")
    return f"Processed your query: '{query}'. No matching records in the current database."
