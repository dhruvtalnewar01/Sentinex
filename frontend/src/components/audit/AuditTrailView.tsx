import { useStore } from '../../stores/useIncidentStore'
import { useState, useMemo } from 'react'
import { Download, ShieldCheck, Filter } from 'lucide-react'

export default function AuditTrailView() {
  const { incidents, auditLog } = useStore()
  const [selectedIncId, setSelectedIncId] = useState<string | null>(null)

  const displayLog = useMemo(() => {
    if (selectedIncId === 'ALL') return auditLog
    if (selectedIncId) {
      const inc = incidents.find(i => i.incident_id === selectedIncId)
      return inc ? inc.audit_log : []
    }
    return auditLog
  }, [selectedIncId, auditLog, incidents])

  const agentColor = (agent: string) => {
    const m: Record<string, string> = {
      'threat_hunter': 'text-cyan-agent bg-cyan-agent/10 border-cyan-agent/30',
      'soc_analyst': 'text-blue-info bg-blue-info/10 border-blue-info/30',
      'incident_responder': 'text-orange-high bg-orange-high/10 border-orange-high/30',
      'forensics_agent': 'text-purple-forensics bg-purple-forensics/10 border-purple-forensics/30',
      'risk_scorer': 'text-green-primary bg-green-primary/10 border-green-primary/30',
    }
    return m[agent] || 'text-text-muted bg-bg-tertiary border-border-subtle'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-secondary shrink-0">
        <div>
          <div className="text-[14px] font-bold tracking-widest text-text-primary mb-1">IMMUTABLE AUDIT TRAIL</div>
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-primary" /> ISO 27001</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-primary" /> SOC2</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-primary" /> GDPR</span>
            <span>|</span>
            <span>Log integrity: SHA256 chained</span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-hover text-[10px] font-bold text-text-muted cursor-pointer transition">
          <Download size={12} /> Export Audit Log (JSON)
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Incident Filter Sidebar */}
        <div className="w-64 border-r border-border-subtle bg-bg-secondary shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-border-subtle text-[10px] font-bold tracking-widest text-text-muted flex items-center gap-2">
            <Filter size={12} /> FILTER BY INCIDENT
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div 
              onClick={() => setSelectedIncId('ALL')}
              className={`px-3 py-2 rounded text-[11px] font-medium cursor-pointer transition-colors mb-1 ${!selectedIncId || selectedIncId === 'ALL' ? 'bg-bg-tertiary text-text-primary' : 'text-text-muted hover:bg-bg-hover'}`}
            >
              All Activity ({auditLog.length} events)
            </div>
            {incidents.map(inc => (
              <div 
                key={inc.incident_id}
                onClick={() => setSelectedIncId(inc.incident_id)}
                className={`px-3 py-2 rounded text-[11px] cursor-pointer transition-colors mb-1 flex flex-col gap-1 ${selectedIncId === inc.incident_id ? 'bg-bg-tertiary text-text-primary' : 'text-text-muted hover:bg-bg-hover'}`}
              >
                <div className="font-mono text-[9px]">{inc.incident_id}</div>
                <div className="truncate font-medium">{inc.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Log Stream */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0E1A]">
          {displayLog.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted text-[12px]">
              No audit logs available. Run simulation to populate.
            </div>
          ) : (
            <div className="max-w-4xl font-mono text-[11px]">
              {displayLog.map((log, i) => (
                <div key={i} className="flex gap-4 mb-2 p-2 hover:bg-bg-hover rounded border border-transparent hover:border-border-subtle transition-colors group">
                  <div className="text-text-muted shrink-0 w-20 pt-0.5">{log.timestamp}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider font-bold ${agentColor(log.agent)}`}>
                        {log.agent.replace('_', ' ')}
                      </span>
                      <span className="text-text-secondary font-bold">{log.action}</span>
                      <span className="text-text-muted/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {log.duration_ms.toFixed(1)}ms
                      </span>
                    </div>
                    <div className="text-text-muted leading-relaxed pl-1">
                      {log.details}
                    </div>
                    {log.result && (
                      <div className="text-green-primary mt-1 pl-1 text-[10px]">
                        Result: {log.result}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center text-[10px] text-text-muted/30 mt-8 mb-4 border-t border-border-subtle/30 pt-4">
                End of immutable record
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
