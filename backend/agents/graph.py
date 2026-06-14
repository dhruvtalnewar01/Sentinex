"""
SENTINEX v2.0 — LangGraph StateGraph Assembly
The CORE agent orchestration graph connecting all 5 agents
"""
from typing import Dict, Any, Optional
from backend.agents.state import AgentState
from backend.agents.threat_hunter import threat_hunter_node
from backend.agents.soc_analyst import soc_analyst_node
from backend.agents.incident_responder import incident_responder_node
from backend.agents.forensics_agent import forensics_agent_node
from backend.agents.risk_scorer import risk_scorer_node
from backend.agents.routing import (
    route_after_threat_hunter,
    route_after_soc_analyst,
    route_after_incident_responder,
    route_after_forensics,
)
from backend.core.logging import get_logger

logger = get_logger("graph")


def build_sentinex_graph(checkpointer=None):
    """
    Build and compile the SENTINEX LangGraph StateGraph.

    Graph topology:
        threat_hunter → (conditional) → soc_analyst ↺ → incident_responder → forensics_agent → risk_scorer → END
                                                     ↘ forensics_agent → risk_scorer → END
    """
    try:
        from langgraph.graph import StateGraph, END

        graph = StateGraph(AgentState)

        # ── Add Nodes ──
        graph.add_node("threat_hunter", threat_hunter_node)
        graph.add_node("soc_analyst", soc_analyst_node)
        graph.add_node("incident_responder", incident_responder_node)
        graph.add_node("forensics_agent", forensics_agent_node)
        graph.add_node("risk_scorer", risk_scorer_node)

        # ── Set Entry Point ──
        graph.set_entry_point("threat_hunter")

        # ── Conditional Edges ──
        graph.add_conditional_edges(
            "threat_hunter",
            route_after_threat_hunter,
            {"soc_analyst": "soc_analyst", "__end__": END},
        )

        graph.add_conditional_edges(
            "soc_analyst",
            route_after_soc_analyst,
            {
                "soc_analyst": "soc_analyst",
                "incident_responder": "incident_responder",
                "forensics_agent": "forensics_agent",
            },
        )

        graph.add_conditional_edges(
            "incident_responder",
            route_after_incident_responder,
            {"forensics_agent": "forensics_agent"},
        )

        graph.add_conditional_edges(
            "forensics_agent",
            route_after_forensics,
            {"risk_scorer": "risk_scorer"},
        )

        # ── Terminal Edge ──
        graph.add_edge("risk_scorer", END)

        # ── Compile ──
        compiled = graph.compile(checkpointer=checkpointer)
        logger.info("sentinex_graph_compiled", nodes=5, edges=7)
        return compiled

    except ImportError as e:
        logger.warning("langgraph_not_available", error=str(e))
        return None


class SentinexOrchestrator:
    """High-level orchestrator for processing events through the agent graph."""

    def __init__(self):
        self.graph = build_sentinex_graph()
        if self.graph:
            logger.info("sentinex_orchestrator_ready")
        else:
            logger.warning("sentinex_orchestrator_fallback_mode")

    async def process_event(self, raw_event: Dict[str, Any],
                            thread_id: Optional[str] = None) -> AgentState:
        """Process a single event through the full agent pipeline."""
        initial_state: AgentState = {
            "raw_event": raw_event,
            "threat_score": 0.0,
            "threat_type": "normal",
            "mitre_techniques": [],
            "investigation_depth": 0,
            "evidence_chain": [],
            "confidence": 0.0,
            "should_respond": False,
            "response_actions": [],
            "kill_chain": {},
            "cvss_score": 0.0,
            "cvss_vector": "",
            "business_impact": "LOW",
            "business_impact_narrative": "",
            "hitl_required": False,
            "audit_log": [],
            "incident_id": "",
            "incident_title": "",
            "incident_severity": "LOW",
        }

        if self.graph:
            config = {"configurable": {"thread_id": thread_id or "default"}}
            result = await self.graph.ainvoke(initial_state, config)
            logger.info(
                "pipeline_complete",
                incident_id=result.get("incident_id"),
                cvss_score=result.get("cvss_score"),
                business_impact=result.get("business_impact"),
            )
            return result
        else:
            # Fallback: run agents sequentially without LangGraph
            return await self._fallback_pipeline(initial_state)

    async def _fallback_pipeline(self, state: AgentState) -> AgentState:
        """Run agents sequentially when LangGraph isn't available."""
        # Node 1: Threat Hunter
        updates = await threat_hunter_node(state)
        state = {**state, **updates}

        # Check threshold
        if state["threat_score"] <= 0.55:
            return state

        # Node 2: SOC Analyst (up to 3 rounds)
        for _ in range(3):
            updates = await soc_analyst_node(state)
            state = {**state, **updates}
            if state.get("confidence", 0) >= 85 or state.get("investigation_depth", 0) >= 3:
                break

        # Node 3: Incident Responder (conditional)
        if state.get("should_respond", False):
            updates = await incident_responder_node(state)
            state = {**state, **updates}

        # Node 4: Forensics Agent
        updates = await forensics_agent_node(state)
        state = {**state, **updates}

        # Node 5: Risk Scorer
        updates = await risk_scorer_node(state)
        state = {**state, **updates}

        return state
