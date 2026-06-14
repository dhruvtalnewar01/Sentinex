/**
 * SENTINEX v3.0 — Corrected Simulation Data
 * All 5 critical bugs fixed:
 *   BUG 1: MITRE ATT&CK IDs validated against v14
 *   BUG 2: No phantom incidents (only 3 real IDs)
 *   BUG 3: Correct CVSS 4.0 vector format (11 metrics)
 *   BUG 4: Agent processing counts corrected
 *   BUG 5: HITL logic fixed (CRITICAL=HITL, MEDIUM=auto)
 */

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface KillChainStage {
  stage: string;
  technique: string;
  technique_name: string;
  timestamp: string;
  affected_asset: string;
  evidence: string[];
  ioc: string;
}

export interface EvidenceEntry {
  round: number;
  confidence: number;
  reasoning: string;
}

export interface ResponseAction {
  action: string;
  timestamp: string;
  result: string;
}

export interface ProposedAction {
  action: string;
  irreversibility: number;
}

export interface AuditEntry {
  agent: string;
  action: string;
  timestamp: string;
  duration_ms: number;
  details: string;
  result?: string;
}

export interface Attacker {
  sophistication: string;
  attribution: string;
  confidence: number;
  dwell_time_hours: number;
  data_exfiltrated: boolean;
}

export interface Incident {
  incident_id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'HITL' | 'CONTAINED' | 'OPEN' | 'ESCALATED' | 'FALSE_POSITIVE';
  description: string;
  source_ip: string;
  destination_ip: string;
  category: string;
  cvss_score: number;
  cvss_vector: string;
  mitre_technique: string;
  mitre_name: string;
  threat_score: number;
  confidence: number;
  investigation_rounds: number;
  should_respond: boolean;
  hitl_required: boolean;
  auto_contained: boolean;
  response_actions: ResponseAction[];
  proposed_actions: ProposedAction[];
  iocs: string[];
  evidence_chain: EvidenceEntry[];
  kill_chain: KillChainStage[];
  attacker: Attacker;
  audit_log: AuditEntry[];
  geolocation: { country: string; city: string; lat: number; lon: number };
}

export interface AgentInfo {
  name: string;
  key: string;
  icon: string;
  status: 'ACTIVE' | 'IDLE' | 'DONE' | 'LOADING';
  processed: number;
  avgLatency: number;
  description: string;
  color: string;
  activity: string;
}

// ═══════════════════════════════════════
// Agent Pipeline Initial State
// ═══════════════════════════════════════
export const INITIAL_AGENTS: AgentInfo[] = [
  { name: 'Threat Hunter', key: 'threat_hunter', icon: '🔍', status: 'IDLE', processed: 0, avgLatency: 0, description: 'IsolationForest ML', color: '#22D3EE', activity: '' },
  { name: 'SOC Analyst', key: 'soc_analyst', icon: '🧠', status: 'IDLE', processed: 0, avgLatency: 0, description: 'Claude Sonnet 4', color: '#60A5FA', activity: '' },
  { name: 'Incident Responder', key: 'incident_responder', icon: '⚡', status: 'IDLE', processed: 0, avgLatency: 0, description: 'Autonomous Response', color: '#FF7B25', activity: '' },
  { name: 'Forensics Agent', key: 'forensics_agent', icon: '🔬', status: 'IDLE', processed: 0, avgLatency: 0, description: 'Kill Chain Analysis', color: '#A78BFA', activity: '' },
  { name: 'Risk Scorer', key: 'risk_scorer', icon: '📊', status: 'IDLE', processed: 0, avgLatency: 0, description: 'CVSS 4.0 Scoring', color: '#06FFA5', activity: '' },
];

// ═══════════════════════════════════════
// CORRECTED Incident Data (All 5 Bugs Fixed)
// ═══════════════════════════════════════

const now = new Date();
const ts = (minAgo: number) => new Date(now.getTime() - minAgo * 60000).toISOString();
const tsShort = (minAgo: number) => new Date(now.getTime() - minAgo * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** INCIDENT 1 — MEDIUM — Port Scan (BUG 1 FIX: T1046 not T1846) */
export const INCIDENT_PORT_SCAN: Incident = {
  incident_id: 'INC-2026-0003',
  title: 'Port Scan — Reconnaissance Activity',
  severity: 'MEDIUM',
  status: 'OPEN',    // BUG 5 FIX: MEDIUM = auto, no HITL needed
  description: 'Reconnaissance scanning detected from Tor exit node. 200+ ports scanned across DMZ subnet in 3.2 seconds. May indicate pre-attack staging by automated tooling.',
  source_ip: '198.51.100.23',
  destination_ip: '10.0.1.0/24',
  category: 'Discovery',
  cvss_score: 4.3,
  // BUG 3 FIX: Correct CVSS 4.0 format with all 11 metrics
  cvss_vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
  mitre_technique: 'T1046',  // BUG 1 FIX: Correct MITRE ID
  mitre_name: 'Network Service Discovery',
  threat_score: 0.610,
  confidence: 76,
  investigation_rounds: 1,
  should_respond: false,
  hitl_required: false,     // BUG 5 FIX: MEDIUM = no HITL
  auto_contained: false,
  response_actions: [],
  proposed_actions: [],
  iocs: ['198.51.100.23'],
  evidence_chain: [
    { round: 1, confidence: 76, reasoning: 'Port scanning from Tor exit node (198.51.100.23). 200 ports targeted in 3.2 seconds across DMZ subnet 10.0.1.0/24. Reconnaissance pattern consistent with pre-attack staging by automated tooling. No exploitation attempts detected yet.' },
  ],
  kill_chain: [
    { stage: 'Reconnaissance', technique: 'T1595', technique_name: 'Active Scanning', timestamp: tsShort(5), affected_asset: 'DMZ subnet (10.0.1.0/24)', evidence: ['200+ TCP SYN packets in 3.2s', 'Tor exit node fingerprint detected', 'Sequential port scan pattern (1-1024)'], ioc: '198.51.100.23' },
  ],
  attacker: { sophistication: 'Script Kiddie', attribution: 'Unknown (Tor)', confidence: 25, dwell_time_hours: 0, data_exfiltrated: false },
  audit_log: [
    { agent: 'threat_hunter', action: 'anomaly_detection', timestamp: tsShort(5), duration_ms: 8.4, details: 'IsolationForest score: 0.610, type: port_scan' },
    { agent: 'soc_analyst', action: 'investigation_round_1', timestamp: tsShort(4.8), duration_ms: 1200, details: 'Classification: Discovery — Reconnaissance. Confidence: 76%' },
    { agent: 'forensics_agent', action: 'kill_chain_reconstruction', timestamp: tsShort(4.5), duration_ms: 890, details: '1-stage kill chain: Reconnaissance only' },
    { agent: 'risk_scorer', action: 'cvss_4_scoring', timestamp: tsShort(4.2), duration_ms: 560, details: 'CVSS 4.0: 4.3 (MEDIUM). Business impact: LOW' },
  ],
  geolocation: { country: 'NL', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
};

/** INCIDENT 2 — HIGH — Brute Force SSH */
export const INCIDENT_BRUTE_FORCE: Incident = {
  incident_id: 'INC-2026-0002',
  title: 'Brute Force — SSH Credential Attack',
  severity: 'HIGH',
  status: 'CONTAINED',    // BUG 5 FIX: HIGH but reversible = auto-contained
  description: 'Automated SSH brute force attack targeting production jump server. 847 failed login attempts in 23 seconds. Source IP associated with known Mirai botnet infrastructure. IP confirmed malicious in 3 threat intel feeds.',
  source_ip: '103.15.28.91',
  destination_ip: '10.0.1.50',
  category: 'Credential Access',
  cvss_score: 7.2,
  cvss_vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N',
  mitre_technique: 'T1110',
  mitre_name: 'Brute Force',
  threat_score: 0.730,
  confidence: 88,
  investigation_rounds: 1,
  should_respond: true,
  hitl_required: false,     // BUG 5 FIX: IP block is reversible → auto
  auto_contained: true,
  response_actions: [
    { action: 'BLOCKED_IP: 103.15.28.91 via pfSense API', timestamp: tsShort(3.5), result: 'SUCCESS' },
    { action: 'PLAYBOOK: FORCE_PASSWORD_RESET_ALL_AFFECTED', timestamp: tsShort(3.4), result: 'SUCCESS' },
    { action: 'CLOUDFLARE_WAF: Added IP to block list', timestamp: tsShort(3.3), result: 'SUCCESS' },
  ],
  proposed_actions: [],
  iocs: ['103.15.28.91', 'T1110', 'mirai-botnet-signature'],
  evidence_chain: [
    { round: 1, confidence: 88, reasoning: 'Automated brute force attack from known botnet IP (103.15.28.91). 847 failed SSH login attempts in 23 seconds targeting jump-server-prod (10.0.1.50). Pattern matches Mirai botnet tooling. IP confirmed malicious across VirusTotal, AbuseIPDB, and AlienVault OTX threat intel feeds. Autonomous response authorized — IP block is fully reversible.' },
  ],
  kill_chain: [
    { stage: 'Reconnaissance', technique: 'T1046', technique_name: 'Network Service Discovery', timestamp: tsShort(4), affected_asset: '10.0.1.50', evidence: ['SSH port 22 discovery via SYN scan'], ioc: '103.15.28.91' },
    { stage: 'Initial Access', technique: 'T1110', technique_name: 'Brute Force', timestamp: tsShort(3.8), affected_asset: 'jump-server-prod', evidence: ['847 failed SSH auth in 23s', 'Dictionary attack pattern detected', 'Mirai botnet signature match'], ioc: '103.15.28.91' },
  ],
  attacker: { sophistication: 'Cybercriminal', attribution: 'Mirai Botnet Variant', confidence: 45, dwell_time_hours: 0.01, data_exfiltrated: false },
  audit_log: [
    { agent: 'threat_hunter', action: 'anomaly_detection', timestamp: tsShort(4), duration_ms: 9.1, details: 'IsolationForest score: 0.730, type: brute_force' },
    { agent: 'soc_analyst', action: 'investigation_round_1', timestamp: tsShort(3.8), duration_ms: 1560, details: 'Classification: Credential Access — Brute Force. Confidence: 88%. Autonomous response authorized.' },
    { agent: 'incident_responder', action: 'block_ip', timestamp: tsShort(3.5), duration_ms: 340, details: 'BLOCKED 103.15.28.91 via pfSense API. Cloudflare WAF rule added.', result: 'SUCCESS' },
    { agent: 'incident_responder', action: 'execute_playbook', timestamp: tsShort(3.4), duration_ms: 1200, details: 'PLAYBOOK: FORCE_PASSWORD_RESET — 12 accounts reset', result: 'SUCCESS' },
    { agent: 'forensics_agent', action: 'kill_chain_reconstruction', timestamp: tsShort(3.2), duration_ms: 1100, details: '2-stage kill chain: Reconnaissance → Initial Access' },
    { agent: 'risk_scorer', action: 'cvss_4_scoring', timestamp: tsShort(3), duration_ms: 780, details: 'CVSS 4.0: 7.2 (HIGH). Business impact: HIGH' },
  ],
  geolocation: { country: 'CN', city: 'Shanghai', lat: 31.2304, lon: 121.4737 },
};

/** INCIDENT 3 — CRITICAL — APT28 Lateral Movement (BUG 5 FIX: HITL required) */
export const INCIDENT_APT28: Incident = {
  incident_id: 'INC-2026-0001',
  title: 'Lateral Movement — APT28 Pass-the-Hash',
  severity: 'CRITICAL',
  status: 'HITL',    // BUG 5 FIX: CRITICAL + irreversible = HITL REQUIRED
  description: 'Sophisticated lateral movement campaign detected using Pass-the-Hash technique (T1550.002). NTLM credential reuse from previously compromised endpoint. TTP fingerprint matches APT28 (Fancy Bear) infrastructure. 6-stage kill chain reconstructed. Cross-incident correlation with INC-2026-0002 confirms multi-stage campaign.',
  source_ip: '185.220.101.47',
  destination_ip: '10.0.1.56',
  category: 'Lateral Movement',
  cvss_score: 8.9,
  cvss_vector: 'CVSS:4.0/AV:N/AC:H/AT:N/PR:H/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H',
  mitre_technique: 'T1550.002',
  mitre_name: 'Pass the Hash',
  threat_score: 0.871,
  confidence: 91,
  investigation_rounds: 2,
  should_respond: true,
  hitl_required: true,      // BUG 5 FIX: Network segmentation is irreversible
  auto_contained: false,
  response_actions: [],     // PENDING human approval
  proposed_actions: [
    { action: 'NETWORK_SEGMENT: Isolate 10.0.1.56 from production VLAN', irreversibility: 0.85 },
    { action: 'BLOCK_IP: 185.220.101.47 at perimeter firewall', irreversibility: 0.60 },
    { action: 'PLAYBOOK: ISOLATE_AND_REMEDIATE — full endpoint wipe', irreversibility: 0.75 },
  ],
  iocs: ['185.220.101.47', 'T1550.002', 'NTLM-HASH-MISMATCH', 'crontab-persistence'],
  evidence_chain: [
    { round: 1, confidence: 71, reasoning: 'Unusual NTLM authentication pattern from endpoint 10.0.1.50. Hash reuse detected across 3 internal hosts. Source IP 185.220.101.47 resolves to known Tor relay in Romania. Requesting second investigation round for APT attribution confirmation.' },
    { round: 2, confidence: 91, reasoning: 'Confirmed APT28 lateral movement campaign. NTLM hash exfiltrated from earlier brute force on jump-server (INC-2026-0002 is related predecessor). Cross-incident correlation confirms coordinated multi-stage campaign. TTP fingerprint matches Fancy Bear infrastructure with 87% attribution confidence. Network segmentation recommended but requires human approval due to irreversibility score 0.85.' },
  ],
  kill_chain: [
    { stage: 'Reconnaissance', technique: 'T1595', technique_name: 'Active Scanning', timestamp: tsShort(8), affected_asset: 'DMZ perimeter', evidence: ['External scanning from 185.220.101.47', 'Service enumeration on ports 22, 80, 443, 3389'], ioc: '185.220.101.47' },
    { stage: 'Initial Access', technique: 'T1110', technique_name: 'Brute Force', timestamp: tsShort(6), affected_asset: 'jump-server-prod (10.0.1.50)', evidence: ['SSH brute force (related: INC-2026-0002)', 'Credential obtained via dictionary attack'], ioc: '103.15.28.91' },
    { stage: 'Execution', technique: 'T1059.001', technique_name: 'PowerShell', timestamp: tsShort(5), affected_asset: 'jump-server-prod', evidence: ['Encoded PowerShell payload executed', 'Base64 decoded: Invoke-Mimikatz -DumpCreds'], ioc: 'encoded-powershell-payload' },
    { stage: 'Credential Access', technique: 'T1550.002', technique_name: 'Pass the Hash', timestamp: tsShort(4), affected_asset: '10.0.1.50', evidence: ['NTLM hash extracted via Mimikatz', 'Hash reuse detected: NTLM pass-the-hash to 10.0.1.56', '3 internal hosts accessed with stolen credentials'], ioc: 'NTLM-HASH-MISMATCH' },
    { stage: 'Lateral Movement', technique: 'T1021.002', technique_name: 'SMB/Windows Admin Shares', timestamp: tsShort(3), affected_asset: '10.0.1.56 (db-analytics-01)', evidence: ['SMB admin share access from 10.0.1.50', 'PsExec remote execution detected', 'Service creation on target host'], ioc: 'psexec-service-creation' },
    { stage: 'Discovery', technique: 'T1046', technique_name: 'Network Service Discovery', timestamp: tsShort(2.5), affected_asset: 'Internal network', evidence: ['Internal network scan from compromised host', 'Database port enumeration (5432, 3306, 1433)', 'Active Directory LDAP queries'], ioc: 'internal-recon-scan' },
  ],
  attacker: { sophistication: 'APT', attribution: 'APT28 (Fancy Bear)', confidence: 87, dwell_time_hours: 0.03, data_exfiltrated: false },
  audit_log: [
    { agent: 'threat_hunter', action: 'anomaly_detection', timestamp: tsShort(8), duration_ms: 12.3, details: 'IsolationForest score: 0.871, type: lateral_movement. XGBoost confirmation: 0.89' },
    { agent: 'soc_analyst', action: 'investigation_round_1', timestamp: tsShort(7), duration_ms: 2340, details: 'Round 1/2 — Confidence: 71%. NTLM anomaly detected. Insufficient evidence for autonomous response. Initiating round 2.' },
    { agent: 'soc_analyst', action: 'investigation_round_2', timestamp: tsShort(5.5), duration_ms: 1890, details: 'Round 2/2 — Confidence: 91%. APT28 attribution confirmed. Cross-incident correlation with INC-2026-0002. HITL required: irreversibility score 0.85.' },
    { agent: 'incident_responder', action: 'hitl_escalation', timestamp: tsShort(5), duration_ms: 120, details: 'HITL escalation: 3 proposed actions pending human approval. Irreversibility scores: 0.85, 0.60, 0.75' },
    { agent: 'forensics_agent', action: 'kill_chain_reconstruction', timestamp: tsShort(4.5), duration_ms: 3200, details: '6-stage kill chain reconstructed. APT sophistication confirmed. Attribution: APT28 (Fancy Bear) at 87% confidence.' },
    { agent: 'risk_scorer', action: 'cvss_4_scoring', timestamp: tsShort(4), duration_ms: 1100, details: 'CVSS 4.0: 8.9 (CRITICAL). Business impact: CRITICAL. Full vector: CVSS:4.0/AV:N/AC:H/AT:N/PR:H/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H' },
  ],
  geolocation: { country: 'RO', city: 'Bucharest', lat: 44.4268, lon: 26.1025 },
};

/** All incidents in creation order (during simulation) */
export const DEMO_INCIDENTS: Incident[] = [
  INCIDENT_PORT_SCAN,
  INCIDENT_BRUTE_FORCE,
  INCIDENT_APT28,
];

// ═══════════════════════════════════════
// Attack origin geolocations for world map
// ═══════════════════════════════════════
export const ATTACK_ORIGINS = [
  { ip: '198.51.100.23', country: 'Netherlands', city: 'Amsterdam', lat: 52.37, lon: 4.90, incident: 'INC-2026-0003', severity: 'MEDIUM' as const },
  { ip: '103.15.28.91', country: 'China', city: 'Shanghai', lat: 31.23, lon: 121.47, incident: 'INC-2026-0002', severity: 'HIGH' as const },
  { ip: '185.220.101.47', country: 'Romania', city: 'Bucharest', lat: 44.43, lon: 26.10, incident: 'INC-2026-0001', severity: 'CRITICAL' as const },
];

export const HQ_LOCATION = { city: 'San Francisco', lat: 37.77, lon: -122.42 };

// ═══════════════════════════════════════
// Timeline data generator
// ═══════════════════════════════════════
export function generateTimelineData(minutes: number = 60) {
  const data = [];
  const n = Date.now();
  for (let i = minutes; i >= 0; i--) {
    const t = new Date(n - i * 60000);
    const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const base = Math.sin(i / 8) * 15 + 25;
    data.push({
      time: timeStr,
      events: Math.max(0, Math.round(base + Math.random() * 30)),
      threats: Math.max(0, Math.round(base * 0.12 + Math.random() * 4)),
      blocked: Math.max(0, Math.round(base * 0.08 + Math.random() * 2)),
    });
  }
  return data;
}

// ═══════════════════════════════════════
// NL Query — BUG 2 FIX: Only real incident IDs
// ═══════════════════════════════════════
export const EXAMPLE_QUERIES = [
  'Show all CRITICAL incidents in last 24h',
  'Find all IPs that attacked asset db-prod-01',
  'Which MITRE techniques appeared most this week',
  'Show APT28 activity last 24 hours',
  'Show lateral movement attempts last 7 days',
  'List all auto-contained incidents today',
];

// BUG 2 FIX: Removed phantom INC-2026-0004. All responses reference only existing incidents.
export const QUERY_RESPONSES: Record<string, { answer: string; cypher: string }> = {
  'show all critical incidents in last 24h': {
    answer: 'Found **1 CRITICAL** incident in the last 24 hours:\n\n**INC-2026-0001** — APT28 Lateral Movement — Pass-the-Hash\n• Source: 185.220.101.47 (Bucharest, Romania)\n• CVSS 4.0: **8.9** (CRITICAL)\n• 6-stage kill chain reconstructed\n• Status: **⚠ HITL** — Awaiting human approval\n• Technique: T1550.002 (Pass the Hash)',
    cypher: "MATCH (i:Incident)\nWHERE i.severity = 'CRITICAL'\nAND i.created_at >= datetime() - duration('P1D')\nRETURN i ORDER BY i.cvss_score DESC",
  },
  'show apt28 activity last 24 hours': {
    answer: 'Detected **1 incident** attributed to **APT28 (Fancy Bear)** in the last 24 hours:\n\n**INC-2026-0001** — Lateral Movement via Pass-the-Hash (T1550.002)\n• 6-stage kill chain: Recon → Brute Force → PowerShell → PtH → SMB Lateral → Discovery\n• Attribution confidence: **87%**\n• Cross-incident correlation: Related to **INC-2026-0002** (SSH brute force was initial access vector)\n• Affected assets: 10.0.1.50, 10.0.1.56\n• Status: **⚠ HITL** — Pending human review',
    cypher: "MATCH (i:Incident)-[:ATTRIBUTED_TO]->(ta:ThreatActor {name: 'APT28'})\nWHERE i.created_at >= datetime() - duration('P1D')\nRETURN i, ta ORDER BY i.cvss_score DESC",
  },
  'which mitre techniques appeared most this week': {
    answer: 'Top MITRE ATT&CK techniques observed this week:\n\n| # | Technique | Name | Count |\n|---|-----------|------|-------|\n| 1 | T1110 | Brute Force | 2 |\n| 2 | T1046 | Network Service Discovery | 2 |\n| 3 | T1550.002 | Pass the Hash | 1 |\n| 4 | T1059.001 | PowerShell | 1 |\n| 5 | T1021.002 | SMB/Windows Admin Shares | 1 |\n| 6 | T1595 | Active Scanning | 1 |',
    cypher: "MATCH (i:Incident)-[:USES]->(t:Technique)\nWHERE i.created_at >= datetime() - duration('P7D')\nRETURN t.id, t.name, count(i) AS cnt\nORDER BY cnt DESC LIMIT 10",
  },
  'list all auto-contained incidents today': {
    answer: 'Found **1 auto-contained** incident today:\n\n**INC-2026-0002** — Brute Force — SSH Credential Attack\n• Severity: HIGH (CVSS 7.2)\n• Actions taken autonomously:\n  ✓ Blocked IP 103.15.28.91 via pfSense API\n  ✓ Cloudflare WAF rule added\n  ✓ Password reset for 12 affected accounts\n• Rationale: IP block is fully reversible — autonomous response authorized',
    cypher: "MATCH (i:Incident)\nWHERE i.status = 'CONTAINED'\nAND i.auto_contained = true\nAND i.created_at >= datetime() - duration('P1D')\nRETURN i",
  },
  'find all ips that attacked asset db-prod-01': {
    answer: 'No direct attacks on **db-prod-01** found in current dataset.\n\nRelated activity: **INC-2026-0001** shows lateral movement targeting **10.0.1.56 (db-analytics-01)** via SMB admin shares from compromised jump server.\n\nSource IPs in attack chain:\n• 185.220.101.47 (Romania — APT28 C2)\n• 103.15.28.91 (China — Mirai botnet, initial access)',
    cypher: "MATCH (ip:IP)-[:ATTACKED]->(a:Asset {name: 'db-prod-01'})\nRETURN ip.address, ip.country, ip.threat_score\nORDER BY ip.threat_score DESC",
  },
  'show lateral movement attempts last 7 days': {
    answer: 'Found **1 lateral movement** incident in the last 7 days:\n\n**INC-2026-0001** — APT28 Pass-the-Hash\n• Technique: T1550.002 → T1021.002 (PtH → SMB Admin Shares)\n• Path: 10.0.1.50 → 10.0.1.56\n• Method: NTLM hash reuse + PsExec remote execution\n• Status: **⚠ HITL** — Network segmentation pending approval',
    cypher: "MATCH (i:Incident)\nWHERE i.category = 'Lateral Movement'\nAND i.created_at >= datetime() - duration('P7D')\nRETURN i ORDER BY i.threat_score DESC",
  },
};
