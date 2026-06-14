import { useStore } from '../../stores/useIncidentStore'
import { useState } from 'react'
import { Search, Link2, ClipboardList } from 'lucide-react'

const SEV_BADGE: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium' }
const STATUS_BADGE: Record<string, string> = { CONTAINED: 'badge-contained', HITL: 'badge-hitl', OPEN: 'badge-open', FALSE_POSITIVE: 'badge-open', ESCALATED: 'badge-high' }
const SEV_BORDER: Record<string, string> = { CRITICAL: '#FF4757', HIGH: '#FF7B25', MEDIUM: '#FFD93D' }

export default function IncidentTable() {
  const { incidents, selectIncident, selectedIncident, metrics, setActiveTab } = useStore()
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const filtered = incidents
    .filter(i => filter === 'ALL' || i.severity === filter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.source_ip.includes(search) || i.incident_id.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="h-full flex flex-col bg-[#0B0F19]">
      {/* Header + Filters */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0 bg-[#0D111C]/90 backdrop-blur-md z-10 shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <span className="text-xs tracking-widest text-[#A78BFA] font-bold"><span className="text-white/30 mr-1">▸</span> INCIDENTS</span>
          <span className="text-xs text-white/60 font-mono bg-[#151A28] border border-white/10 px-2 py-0.5 rounded shadow-inner">{incidents.length} TOTAL</span>
          {metrics.criticalCount > 0 && <span className="badge badge-critical px-2 py-0.5 bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/30 shadow-[0_0_10px_rgba(255,51,102,0.2)]">{metrics.criticalCount} CRITICAL</span>}
          {metrics.highCount > 0 && <span className="badge badge-high px-2 py-0.5 bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/30 shadow-[0_0_10px_rgba(255,106,0,0.2)]">{metrics.highCount} HIGH</span>}
          {metrics.autoContained > 0 && <span className="badge badge-contained px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">{metrics.autoContained} CONTAINED</span>}
        </div>
        <div className="flex items-center gap-4">
          {/* Severity filter */}
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-[10px] tracking-wider font-bold bg-[#151A28] border border-white/10 rounded-md px-3 py-1.5 text-white/70 focus:outline-none focus:border-[#00E5FF]/50 cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all">
            <option value="ALL">ALL SEVERITY</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="text-xs font-medium bg-[#151A28] border border-white/10 rounded-md pl-9 pr-3 py-1.5 w-48 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#00E5FF]/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4 perspective-1000">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <div className="text-5xl mb-6 opacity-20 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">🛡️</div>
            <div className="text-sm font-bold mb-2 tracking-widest">{incidents.length === 0 ? 'NO INCIDENTS DETECTED' : 'NO MATCHING INCIDENTS'}</div>
            {incidents.length === 0 && <div className="text-xs text-white/50 font-medium mt-2">Click <span className="text-[#FF3366] font-bold px-1.5 py-0.5 bg-[#FF3366]/10 rounded border border-[#FF3366]/20 shadow-[0_0_8px_rgba(255,51,102,0.2)] mx-1">LAUNCH ATTACK SIM</span> to start</div>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inc, idx) => {
              const isSelected = selectedIncident?.incident_id === inc.incident_id
              return (
                <div
                  key={inc.incident_id}
                  onClick={() => selectIncident(inc)}
                  className={`flex items-center gap-5 px-6 py-4 rounded-xl cursor-pointer transition-all duration-300 border animate-slide-up hover-3d-tilt click-glow ${
                    isSelected ? 'luxury-gradient border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-10 relative' : 'bg-[#111827]/60 border-white/5 hover:bg-[#151A28]/80 hover:border-white/10 shadow-md'
                  }`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: SEV_BORDER[inc.severity] || '#4A5568', animationDelay: `${idx * 40}ms` }}
                >
                  <span className={`badge ${SEV_BADGE[inc.severity]} shrink-0 w-20 justify-center py-1.5 font-bold tracking-widest text-[9px]`}>{inc.severity}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-white drop-shadow-md truncate mb-1 tracking-tight">{inc.title}</div>
                    <div className="flex items-center gap-3 text-xs text-white/50 font-medium">
                      <span className="font-mono bg-[#0B0F19] border border-white/5 px-1.5 py-0.5 rounded shadow-inner">{inc.source_ip}</span>
                      <span className="text-[#00E5FF]/40">→</span>
                      <span className="font-mono bg-[#0B0F19] border border-white/5 px-1.5 py-0.5 rounded shadow-inner">{inc.destination_ip}</span>
                      <span className="opacity-20 mx-1">|</span>
                      <span className="tracking-widest uppercase text-white/40">{inc.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-16">
                    <div className={`text-[18px] font-mono font-bold tracking-tighter drop-shadow-lg ${inc.cvss_score >= 9 ? 'text-[#FF3366]' : inc.cvss_score >= 7 ? 'text-[#FF6A00]' : inc.cvss_score >= 4 ? 'text-[#FFD93D]' : 'text-[#00E5FF]'}`}>
                      {inc.cvss_score.toFixed(1)}
                    </div>
                    <div className="text-[9px] text-white/40 tracking-widest font-bold">CVSS</div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[inc.status] || 'badge-open'} shrink-0 w-28 justify-center py-1.5 font-bold tracking-widest text-[9px] ${inc.status === 'HITL' ? 'animate-blink border-[#FF6A00]/50 shadow-[0_0_15px_rgba(255,106,0,0.3)]' : ''}`}>
                    {inc.status === 'CONTAINED' ? '✓ CONTAINED' : inc.status === 'HITL' ? '⚠ HITL' : inc.status}
                  </span>
                  <div className="flex gap-2 shrink-0 pl-4 border-l border-white/10">
                    <button onClick={(e) => { e.stopPropagation(); selectIncident(inc); setActiveTab('killchain'); }} className="p-2 rounded-lg bg-[#0B0F19]/50 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] text-white/50 border border-white/5 hover:border-[#00E5FF]/30 transition-all shadow-inner click-glow" title="Kill Chain"><Link2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); selectIncident(inc); setActiveTab('audit'); }} className="p-2 rounded-lg bg-[#0B0F19]/50 hover:bg-[#A78BFA]/10 hover:text-[#A78BFA] text-white/50 border border-white/5 hover:border-[#A78BFA]/30 transition-all shadow-inner click-glow" title="Audit"><ClipboardList size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
