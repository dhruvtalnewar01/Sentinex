import { useStore } from '../../stores/useIncidentStore'
import { X, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react'

const SEV_BADGE: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium' }

export default function DetailPanel() {
  const { selectedIncident, selectIncident, setActiveTab, hitlAction } = useStore()

  if (!selectedIncident) return null
  const i = selectedIncident

  // Visual CVSS Breakdown helper
  const cvssMetrics = i.cvss_vector.replace('CVSS:4.0/', '').split('/')
  const metricColors: Record<string, string> = { N: 'bg-[#151A28]', L: 'bg-[#FFD93D]/30', M: 'bg-[#FF6A00]/40', H: 'bg-[#E63946]/50', C: 'bg-[#991B1B]' }

  return (
    <div className="flex flex-col h-full bg-[#0D111C]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-white/5 shrink-0 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-3 mb-2.5">
            <span className={`badge ${SEV_BADGE[i.severity]} px-2 py-0.5 shadow-sm`}>{i.severity}</span>
            <span className="text-[10px] text-white/40 font-mono font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded">{i.incident_id}</span>
          </div>
          <h2 className="text-[16px] font-bold text-white/90 leading-tight tracking-tight">{i.title}</h2>
        </div>
        <button onClick={() => selectIncident(null)} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/90 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-white/10">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* CVSS Section */}
        <div className="bg-[#151A28]/50 border border-white/5 rounded-lg p-5 shadow-inner shadow-white/[0.02]">
          <div className="flex items-end gap-3 mb-3">
            <div className={`text-5xl font-black font-mono leading-none tracking-tighter ${i.cvss_score >= 9 ? 'text-[#E63946]' : i.cvss_score >= 7 ? 'text-[#FF6A00]' : 'text-[#FFD93D]'}`}>
              {i.cvss_score.toFixed(1)}
            </div>
            <div className="text-[10px] font-bold tracking-widest text-white/40 mb-1.5">CVSS 4.0</div>
          </div>
          <div className="text-[10px] font-mono text-white/50 mb-3 select-all bg-[#0B0F19] p-2 rounded-md border border-white/5">{i.cvss_vector}</div>
          <div className="flex gap-1 mt-2">
            {cvssMetrics.map(m => {
              const [k, v] = m.split(':')
              return (
                <div key={k} className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md border border-white/5 ${metricColors[v] || 'bg-[#151A28]'}`}>
                  <span className="text-[8px] text-white/40 font-bold tracking-widest">{k}</span>
                  <span className="text-[11px] font-bold text-white/90">{v}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-white/70 font-medium">{i.description}</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-[1px] bg-white/10 border border-white/10 rounded-lg overflow-hidden shadow-inner shadow-white/[0.02]">
          {[
            { l: 'SOURCE IP', v: i.source_ip, m: true }, { l: 'TARGET', v: i.destination_ip, m: true },
            { l: 'CONFIDENCE', v: `${i.confidence}%` }, { l: 'ROUNDS', v: i.investigation_rounds },
            { l: 'CATEGORY', v: i.category }, { l: 'THREAT SCORE', v: i.threat_score.toFixed(3), m: true }
          ].map(m => (
            <div key={m.l} className="bg-[#151A28]/80 p-3 hover:bg-[#151A28] transition-colors">
              <div className="text-[9px] font-bold text-white/30 tracking-widest mb-1">{m.l}</div>
              <div className={`text-[12px] text-white/90 ${m.m ? 'font-mono' : 'font-bold tracking-tight'}`}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* MITRE ATT&CK */}
        <div>
          <div className="text-[10px] tracking-widest text-white/50 font-bold mb-3"><span className="text-white/30">▸</span> MITRE ATT&CK</div>
          <div className="flex items-center justify-between bg-[#151A28]/50 border border-white/5 rounded-lg px-4 py-3 hover:bg-[#151A28]/80 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1 rounded-md border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">{i.mitre_technique}</span>
              <span className="text-[12px] text-white/90 font-bold tracking-tight">{i.mitre_name}</span>
            </div>
            <a href={`https://attack.mitre.org/techniques/${i.mitre_technique.replace('.', '/')}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold tracking-wide text-[#00E5FF] hover:text-white hover:underline flex items-center gap-1.5 transition-colors">
              VIEW <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Response Actions */}
        {i.response_actions.length > 0 && (
          <div>
            <div className="text-[10px] tracking-widest text-white/50 font-bold mb-3"><span className="text-white/30">▸</span> RESPONSE ACTIONS</div>
            <div className="space-y-2">
              {i.response_actions.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[11px] bg-[#00FF9D]/5 border border-[#00FF9D]/20 rounded-lg p-3 shadow-inner shadow-[#00FF9D]/[0.02]">
                  <CheckCircle2 size={16} className="text-[#00FF9D] shrink-0 mt-0.5 shadow-[0_0_8px_#00FF9D] rounded-full" />
                  <div>
                    <div className="font-mono font-bold text-[#00FF9D] mb-1 tracking-wide">{act.action}</div>
                    <div className="text-[10px] font-medium text-white/50">{act.timestamp} <span className="opacity-30 mx-1">|</span> {act.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IOCs */}
        <div>
          <div className="text-[10px] tracking-widest text-white/50 font-bold mb-3"><span className="text-white/30">▸</span> INDICATORS OF COMPROMISE</div>
          <div className="flex flex-wrap gap-2">
            {i.iocs.map(ioc => (
              <button key={ioc} onClick={() => navigator.clipboard.writeText(ioc)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#E63946]/5 border border-[#E63946]/20 hover:bg-[#E63946]/15 hover:border-[#E63946]/40 transition-all cursor-pointer group shadow-inner shadow-[#E63946]/[0.02] click-glow" title="Click to copy">
                <span className="text-[10px]">⚡</span>
                <span className="text-[11px] font-mono font-bold text-[#E63946] group-hover:text-white transition-colors">{ioc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Chain */}
        <div>
          <div className="text-[10px] tracking-widest text-white/50 font-bold mb-4"><span className="text-white/30">▸</span> EVIDENCE CHAIN</div>
          <div className="space-y-4 pl-1">
            {i.evidence_chain.map(ev => (
              <div key={ev.round} className="border-l-2 border-white/10 pl-4 relative">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-white/20 border-2 border-[#0D111C]" />
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-[11px] font-bold text-white/80 tracking-wide">ROUND {ev.round}</span>
                  <span className="text-[10px] text-white/30 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded">CONF: {ev.confidence}%</span>
                </div>
                <div className="text-[12px] font-medium text-white/60 leading-relaxed">{ev.reasoning}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => setActiveTab('killchain')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-white/10 bg-[#151A28] hover:bg-white/5 hover:border-white/20 text-[11px] font-bold tracking-widest text-white/80 transition-all cursor-pointer shadow-sm click-glow">
            🔗 VIEW KILL CHAIN
          </button>
          <button onClick={() => setActiveTab('audit')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-white/10 bg-[#151A28] hover:bg-white/5 hover:border-white/20 text-[11px] font-bold tracking-widest text-white/80 transition-all cursor-pointer shadow-sm click-glow">
            📋 AUDIT TRAIL
          </button>
        </div>

        {/* HITL Panel */}
        {i.hitl_required && (
          <div className="mt-6 bg-[#FF6A00]/5 border border-[#FF6A00]/30 rounded-xl p-5 relative overflow-hidden shadow-[0_0_20px_rgba(255,106,0,0.05)]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF6A00] animate-pulse shadow-[0_0_10px_#FF6A00]" />
            <div className="flex items-center gap-2 text-[#FF6A00] mb-3 border-b border-[#FF6A00]/10 pb-3">
              <ShieldAlert size={16} className="animate-pulse drop-shadow-[0_0_5px_#FF6A00]" />
              <span className="text-[12px] font-bold tracking-widest">HUMAN REVIEW REQUIRED</span>
            </div>
            <p className="text-[11px] font-medium text-white/60 mb-4 leading-relaxed">This incident requires highly irreversible actions. Manual approval is mandatory before execution.</p>
            <div className="space-y-2 mb-5 bg-[#0B0F19]/50 rounded-lg p-3 border border-white/5">
              {i.proposed_actions.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] bg-white/5 border border-white/5 px-3 py-2 rounded-md">
                  <span className="font-mono font-bold text-white/80 truncate mr-3">{act.action}</span>
                  <span className={`shrink-0 font-mono font-bold bg-[#0B0F19] px-2 py-1 rounded ${act.irreversibility > 0.8 ? 'text-[#E63946]' : 'text-[#FF6A00]'}`}>IRR: {act.irreversibility.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-bold tracking-widest text-white/40 mb-1.5">ANALYST ID</div>
              <input type="text" defaultValue="analyst@sentinex.io" className="w-full bg-[#0B0F19] border border-white/10 rounded-md px-3 py-2 text-[11px] font-mono font-bold text-white/80 focus:outline-none focus:border-[#FF6A00]/50 focus:shadow-[0_0_10px_rgba(255,106,0,0.1)] transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => hitlAction(i.incident_id, 'APPROVE', 'analyst@sentinex.io')} className="flex-1 bg-[#00FF9D]/10 border border-[#00FF9D]/40 text-[#00FF9D] hover:bg-[#00FF9D]/20 hover:border-[#00FF9D]/60 py-2.5 rounded-lg text-[11px] font-bold tracking-widest cursor-pointer transition-all shadow-[0_0_15px_rgba(0,255,157,0.1)] click-glow">✓ APPROVE</button>
              <button onClick={() => hitlAction(i.incident_id, 'REJECT', 'analyst@sentinex.io')} className="flex-1 bg-[#E63946]/10 border border-[#E63946]/40 text-[#E63946] hover:bg-[#E63946]/20 hover:border-[#E63946]/60 py-2.5 rounded-lg text-[11px] font-bold tracking-widest cursor-pointer transition-all shadow-[0_0_15px_rgba(230,57,70,0.1)] click-glow">✗ REJECT</button>
              <button onClick={() => hitlAction(i.incident_id, 'ESCALATE', 'analyst@sentinex.io')} className="flex-1 bg-[#151A28] border border-white/10 text-white/70 hover:bg-white/5 hover:text-white py-2.5 rounded-lg text-[11px] font-bold tracking-widest cursor-pointer transition-all click-glow">↑ ESCALATE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
