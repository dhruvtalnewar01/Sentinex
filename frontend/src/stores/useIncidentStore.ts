/**
 * SENTINEX v3.0 — Global State Store
 * Complete rewrite with corrected simulation engine, toast system,
 * and proper agent processing counts (BUG 4 FIX)
 */
import { create } from 'zustand';
import type { Incident, AgentInfo } from '../data/simulationData';
import {
  INITIAL_AGENTS, DEMO_INCIDENTS, generateTimelineData,
  QUERY_RESPONSES,
} from '../data/simulationData';

// ═══════════════════════════════════════
// Toast System Types
// ═══════════════════════════════════════
export interface Toast {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  autoDismiss: boolean;
  duration: number;
  timestamp: number;
}

// ═══════════════════════════════════════
// Store Types
// ═══════════════════════════════════════
interface SentinexState {
  // Data
  incidents: Incident[];
  agents: AgentInfo[];
  timelineData: ReturnType<typeof generateTimelineData>;
  auditLog: { agent: string; action: string; timestamp: string; duration_ms: number; details: string; result?: string }[];
  selectedIncident: Incident | null;
  selectedAuditIncident: string | null;

  // Simulation
  isSimulating: boolean;
  simComplete: boolean;
  simulationPhase: string;
  mttrTimer: number;
  mttrRunning: boolean;
  eventsProcessed: number;
  agentRounds: number;
  autonomousActions: number;

  // Metrics
  metrics: {
    mttr: number;
    totalEvents: number;
    totalIncidents: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    autoContained: number;
    ipsBlocked: number;
    playbooksRun: number;
  };

  // UI
  activeTab: string;
  showDetail: boolean;
  threatMapExpanded: boolean;

  // Toasts
  toasts: Toast[];

  // Query
  queryResult: { answer: string; cypher: string; loading: boolean } | null;

  // View State
  appView: 'landing' | 'dashboard';
  targetUrl: string;
  showCompletionOverlay: boolean;

  // Actions
  startSimulation: () => void;
  selectIncident: (incident: Incident | null) => void;
  setActiveTab: (tab: string) => void;
  submitQuery: (query: string) => void;
  hitlAction: (incidentId: string, action: string, analyst: string) => void;
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  toggleThreatMap: () => void;
  setAppView: (view: 'landing' | 'dashboard') => void;
  setTargetUrl: (url: string) => void;
  hideCompletionOverlay: () => void;
}

let mttrIntervalId: ReturnType<typeof setInterval> | null = null;
let timeoutIds: ReturnType<typeof setTimeout>[] = [];

// Pseudo-random seeded generator
const seededRandom = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  return () => {
    let t = hash += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const useStore = create<SentinexState>((set, get) => ({
  // ── Initial State ──
  incidents: [],
  agents: INITIAL_AGENTS.map(a => ({ ...a })),
  timelineData: generateTimelineData(60),
  auditLog: [],
  selectedIncident: null,
  selectedAuditIncident: null,
  isSimulating: false,
  simComplete: false,
  simulationPhase: '',
  mttrTimer: 0,
  mttrRunning: false,
  eventsProcessed: 0,
  agentRounds: 0,
  autonomousActions: 0,
  metrics: { mttr: 0, totalEvents: 0, totalIncidents: 0, criticalCount: 0, highCount: 0, mediumCount: 0, autoContained: 0, ipsBlocked: 0, playbooksRun: 0 },
  activeTab: 'dashboard',
  showDetail: false,
  threatMapExpanded: false,
  toasts: [],
  queryResult: null,
  appView: 'landing',
  targetUrl: '',
  showCompletionOverlay: false,

  // ══════════════════════════════════════════
  // SIMULATION ENGINE — Phased, Realistic Timing
  // ══════════════════════════════════════════
  startSimulation: () => {
    const state = get();
    if (state.isSimulating) return;

    // Clear previous timers
    if (mttrIntervalId) clearInterval(mttrIntervalId);
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
    
    const random = seededRandom(state.targetUrl || 'default');
    const baseEvents = Math.floor(random() * 2000) + 300;
    const baseMultiplier = 0.5 + random(); // speeds or slows down timings

    set({
      isSimulating: true, simComplete: false, showCompletionOverlay: false,
      mttrTimer: 0, mttrRunning: true,
      eventsProcessed: 0, agentRounds: 0, autonomousActions: 0,
      incidents: [], auditLog: [],
      selectedIncident: null, showDetail: false,
      simulationPhase: 'Initializing Kafka consumer group...',
      metrics: { mttr: 0, totalEvents: 0, totalIncidents: 0, criticalCount: 0, highCount: 0, mediumCount: 0, autoContained: 0, ipsBlocked: 0, playbooksRun: 0 },
    });

    // MTTR timer (0.1s precision)
    mttrIntervalId = setInterval(() => {
      const s = get();
      if (!s.mttrRunning) { if (mttrIntervalId) clearInterval(mttrIntervalId); return; }
      set({ mttrTimer: s.mttrTimer + 0.1 });
    }, 100);

    const toast = (type: Toast['type'], title: string, message?: string, autoDismiss = true, duration = 4000, action?: Toast['action']) => {
      get().addToast({ type, title, message, autoDismiss, duration, action });
    };

    const setAgent = (key: string, updates: Partial<AgentInfo>) => {
      set(s => ({ agents: s.agents.map(a => a.key === key ? { ...a, ...updates } : a) }));
    };

    const delay = (ms: number, fn: () => void) => { const id = setTimeout(fn, ms * baseMultiplier); timeoutIds.push(id); };

    // ── Phase 0: Pre-sim (0-2s) ──
    delay(500, () => set({ simulationPhase: 'Loading IsolationForest + XGBoost models...' }));
    delay(1200, () => {
      set({ simulationPhase: 'Connecting to ChromaDB + Neo4j...' });
      toast('INFO', 'Attack simulation launched', `${baseEvents} events queuing to Kafka ingestion pipeline...`);
    });

    // ── Phase 1: Event Ingestion (2-5s) ──
    delay(2000, () => {
      setAgent('threat_hunter', { status: 'ACTIVE', activity: 'Ingesting events from Kafka...' });
      set({ simulationPhase: `🔍 Threat Hunter: Ingesting ${baseEvents} events via Kafka...` });
    });
    // Smooth counter for events
    for (let i = 1; i <= 10; i++) {
      delay(2000 + i * 300, () => set({ eventsProcessed: Math.min(baseEvents, i * Math.floor(baseEvents/10)) }));
    }

    // ── Phase 2: Threat Detection (5-7s) ──
    delay(5000, () => {
      setAgent('threat_hunter', { status: 'ACTIVE', processed: baseEvents, avgLatency: 8.4, activity: '3 anomalies detected (score > 0.55)' });
      set({ simulationPhase: '🔍 Threat Hunter: 3 anomalies detected — scores: 0.610, 0.730, 0.871' });
      toast('WARNING', 'Threat Hunter: Anomalies detected', '3 events exceeded threat score threshold 0.55');
    });
    delay(6500, () => {
      setAgent('threat_hunter', { status: 'DONE' });
      set({ simulationPhase: '🔍 → 🧠 Handoff to SOC Analyst: 3 events for deep investigation' });
    });

    // ── Phase 3: SOC Analysis Round 1 (7-10s) ──
    delay(7000, () => {
      setAgent('soc_analyst', { status: 'ACTIVE', activity: 'Round 1/2 — Claude Sonnet 4 reasoning...' });
      set({ agentRounds: 1, simulationPhase: '🧠 SOC Analyst: Investigation round 1/2 — Claude Sonnet 4 reasoning...' });
    });
    delay(8500, () => {
      const inc = DEMO_INCIDENTS[0]; 
      set(s => ({
        incidents: [...s.incidents, inc],
        simulationPhase: '🧠 SOC Analyst: [MEDIUM] Port Scan classified — confidence 76%',
        metrics: { ...s.metrics, totalIncidents: 1, mediumCount: 1 },
      }));
      toast('WARNING', '[MEDIUM] Port Scan — Reconnaissance', 'T1046 · 198.51.100.23 → DMZ · CVSS 4.3');
    });
    delay(9500, () => {
      const inc = DEMO_INCIDENTS[1]; 
      set(s => ({
        incidents: [...s.incidents, inc],
        agentRounds: 1,
        simulationPhase: '🧠 SOC Analyst: [HIGH] SSH Brute Force classified — confidence 88%',
        metrics: { ...s.metrics, totalIncidents: 2, highCount: 1 },
      }));
      toast('CRITICAL', '[HIGH] Brute Force — SSH Credential Attack', 'T1110 · 103.15.28.91 → 10.0.1.50 · CVSS 7.2');
    });

    // ── Phase 4: SOC Analysis Round 2 — APT28 (10-13s) ──
    delay(10500, () => {
      setAgent('soc_analyst', { activity: 'Round 2/2 — Deep reasoning: APT28 TTP correlation...' });
      set({ agentRounds: 2, simulationPhase: '🧠 SOC Analyst: Round 2/2 — APT28 TTP correlation + cross-incident analysis...' });
    });
    delay(12500, () => {
      const inc = DEMO_INCIDENTS[2]; 
      setAgent('soc_analyst', { status: 'DONE', processed: 3, avgLatency: 2115 });
      set(s => ({
        incidents: [...s.incidents, inc],
        agentRounds: 2,
        simulationPhase: '🧠 SOC Analyst: [CRITICAL] APT28 confirmed — confidence 91% — ⚠ HITL REQUIRED',
        metrics: { ...s.metrics, totalIncidents: 3, criticalCount: 1 },
      }));
      toast('CRITICAL', '[CRITICAL] APT28 Pass-the-Hash', 'T1550.002 · 185.220.101.47 → 10.0.1.56 · CVSS 8.9', true, 6000);
      toast('WARNING', '⚠ HUMAN REVIEW REQUIRED', 'INC-2026-0001 — APT28 (CVSS 8.9). Network segmentation pending approval.', false, 0, {
        label: 'REVIEW NOW',
        onClick: () => {
          const s = get();
          const apt = s.incidents.find(i => i.incident_id === 'INC-2026-0001');
          if (apt) { set({ selectedIncident: apt, showDetail: true, activeTab: 'dashboard' }); }
        },
      });
    });

    // ── Phase 5: Incident Response (13-15.5s) ──
    delay(13500, () => {
      setAgent('incident_responder', { status: 'ACTIVE', activity: 'Blocking 103.15.28.91 via pfSense API...' });
      set({ simulationPhase: '⚡ Incident Responder: Blocking malicious IPs + executing playbooks...' });
    });
    delay(14000, () => set(s => ({ autonomousActions: 1, simulationPhase: '⚡ BLOCKED IP: 103.15.28.91 via pfSense + Cloudflare WAF' })));
    delay(14800, () => set(s => ({ autonomousActions: 2, simulationPhase: '⚡ PLAYBOOK: FORCE_PASSWORD_RESET — 12 accounts reset' })));
    delay(15500, () => {
      setAgent('incident_responder', { status: 'DONE', processed: 2, avgLatency: 890, activity: '' });
      set(s => ({
        autonomousActions: 3,
        simulationPhase: '⚡ Incident Responder: 1 auto-contained, 1 HITL escalated',
        metrics: { ...s.metrics, autoContained: 1, ipsBlocked: 1, playbooksRun: 1 },
      }));
      toast('SUCCESS', 'INC-2026-0002 contained', 'IP blocked via pfSense · Cloudflare WAF rule added · 12 passwords reset');
    });

    // ── Phase 6: Forensics (15.5-18.5s) ──
    delay(16000, () => {
      setAgent('forensics_agent', { status: 'ACTIVE', activity: 'Reconstructing kill chains for 3 incidents...' });
      set({ simulationPhase: '🔬 Forensics Agent: Reconstructing kill chains for 3 incidents...' });
    });
    delay(17500, () => set({ simulationPhase: '🔬 Forensics: APT28 — 6-stage kill chain reconstructed. Attacker sophistication: APT' }));
    delay(18500, () => setAgent('forensics_agent', { status: 'DONE', processed: 3, avgLatency: 1730, activity: '' }));

    // ── Phase 7: Risk Scoring (18.5-20.5s) ──
    delay(19000, () => {
      setAgent('risk_scorer', { status: 'ACTIVE', activity: 'Computing CVSS 4.0 vectors...' });
      set({ simulationPhase: '📊 Risk Scorer: Computing CVSS 4.0 scores for 3 incidents...' });
    });
    delay(19800, () => set({ simulationPhase: '📊 CVSS 4.0: [4.3] [7.2] [8.9] — Business impact assessment complete' }));
    delay(20500, () => setAgent('risk_scorer', { status: 'DONE', processed: 3, avgLatency: 813, activity: '' }));

    // ── Phase 8: Complete (~21s) ──
    delay(21000, () => {
      set(s => ({
        mttrRunning: false,
        isSimulating: false,
        simComplete: true,
        showCompletionOverlay: true,
        eventsProcessed: baseEvents,
        simulationPhase: '✓ Pipeline complete — 2 auto-contained, 1 awaiting human review',
        metrics: { ...s.metrics, mttr: s.mttrTimer, totalEvents: baseEvents },
        auditLog: DEMO_INCIDENTS.flatMap(inc => inc.audit_log).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      }));
      if (mttrIntervalId) clearInterval(mttrIntervalId);
      toast('SUCCESS', `Pipeline complete — MTTR: ${get().mttrTimer.toFixed(1)}s`, '3 incidents detected · 2 auto-contained · 1 HITL pending');
      setTimeout(() => get().hideCompletionOverlay(), 4000);
    });
  },

  selectIncident: (incident) => set({ selectedIncident: incident, showDetail: !!incident }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleThreatMap: () => set(s => ({ threatMapExpanded: !s.threatMapExpanded })),

  submitQuery: (query) => {
    set({ queryResult: { answer: '', cypher: '', loading: true } });
    const key = query.toLowerCase().trim();
    const match = Object.entries(QUERY_RESPONSES).find(([k]) => key.includes(k) || k.includes(key));
    setTimeout(() => {
      if (match) {
        set({ queryResult: { answer: match[1].answer, cypher: match[1].cypher, loading: false } });
      } else {
        set({ queryResult: {
          answer: `Processed query: "${query}"\n\nNo matching results in current incident database. The knowledge graph contains 3 incidents from the latest simulation run. Try one of the suggested queries.`,
          cypher: `MATCH (i:Incident)\nWHERE toLower(i.title) CONTAINS '${query.toLowerCase().split(' ')[0]}'\nRETURN i LIMIT 10`,
          loading: false,
        }});
      }
    }, 1500);
  },

  hitlAction: (incidentId, action, analyst) => {
    const newStatus = action === 'APPROVE' ? 'CONTAINED' as const : action === 'REJECT' ? 'FALSE_POSITIVE' as const : 'ESCALATED' as const;
    set(s => {
      const updatedIncidents = s.incidents.map(i =>
        i.incident_id === incidentId
          ? { ...i, hitl_required: false, status: newStatus, auto_contained: action === 'APPROVE' }
          : i
      );
      const updatedSelected = s.selectedIncident?.incident_id === incidentId
        ? { ...s.selectedIncident, hitl_required: false, status: newStatus }
        : s.selectedIncident;
      const metrics = { ...s.metrics };
      if (action === 'APPROVE') metrics.autoContained += 1;
      return { incidents: updatedIncidents, selectedIncident: updatedSelected, metrics, showDetail: false };
    });
    const toastType = action === 'APPROVE' ? 'SUCCESS' as const : action === 'REJECT' ? 'WARNING' as const : 'INFO' as const;
    const msg = action === 'APPROVE' ? `${analyst} approved: ${incidentId} → CONTAINED` :
                action === 'REJECT' ? `${analyst} rejected: ${incidentId} → FALSE POSITIVE` :
                `${analyst} escalated: ${incidentId} → Tier 2 SOC`;
    get().addToast({ type: toastType, title: msg, autoDismiss: true, duration: 5000 });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    set(s => ({ toasts: [...s.toasts, { ...toast, id, timestamp: Date.now() }] }));
    if (toast.autoDismiss && toast.duration > 0) {
      setTimeout(() => get().removeToast(id), toast.duration);
    }
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  
  setAppView: (view) => set({ appView: view }),
  setTargetUrl: (url) => set({ targetUrl: url }),
  hideCompletionOverlay: () => set({ showCompletionOverlay: false }),
}));
