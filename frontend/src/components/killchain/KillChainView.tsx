import { useStore } from '../../stores/useIncidentStore'
import { useState, useEffect } from 'react'
import { Download, FileText, ChevronRight } from 'lucide-react'

export default function KillChainView() {
  const { incidents, selectedIncident, selectIncident } = useStore()
  const [activeStage, setActiveStage] = useState<number>(0)
  
  // Set default selection to APT28 if available and nothing selected
  useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      const apt28 = incidents.find(i => i.incident_id === 'INC-2026-0001')
      selectIncident(apt28 || incidents[0])
    }
  }, [incidents, selectedIncident, selectIncident])

  if (incidents.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-text-muted">Run simulation to generate kill chain data</div>
  }
  if (!selectedIncident) return null

  const kc = selectedIncident.kill_chain || []
  const attacker = selectedIncident.attacker
  const sevColor = selectedIncident.severity === 'CRITICAL' ? '#FF4757' : selectedIncident.severity === 'HIGH' ? '#FF7B25' : '#FFD93D'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-secondary shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold tracking-widest text-text-muted">KILL CHAIN FORENSICS</span>
          <select 
            value={selectedIncident.incident_id} 
            onChange={(e) => {
              const inc = incidents.find(i => i.incident_id === e.target.value)
              if (inc) selectIncident(inc)
              setActiveStage(0)
            }}
            className="bg-bg-tertiary border border-border-subtle rounded px-3 py-1.5 text-[11px] font-medium text-text-primary focus:outline-none focus:border-border-accent w-80 cursor-pointer"
          >
            {incidents.map(i => (
              <option key={i.incident_id} value={i.incident_id}>[{i.severity}] {i.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-hover text-[10px] font-bold text-text-muted cursor-pointer transition">
            <Download size={12} /> JSON
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-hover text-[10px] font-bold text-text-muted cursor-pointer transition">
            <FileText size={12} /> PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {kc.length === 0 ? (
          <div className="text-center text-text-muted mt-20">No kill chain data available for this incident.</div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Timeline Graphic */}
            <div className="relative h-32 mb-12 flex items-center justify-between">
              {/* Connecting Line Base */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-border-subtle rounded" />
              {/* Animated Progress Line */}
              <div 
                className="absolute left-8 top-1/2 -translate-y-1/2 h-1 rounded transition-all duration-500 ease-out" 
                style={{ width: `calc(${((kc.length - 1) / 5) * 100}% - 3rem)`, background: `linear-gradient(90deg, rgba(255,255,255,0.1), ${sevColor})` }} 
              />
              
              {/* Nodes */}
              {kc.map((stage, idx) => {
                const isActive = activeStage === idx
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => setActiveStage(idx)}>
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[14px] transition-all duration-300 ${
                        isActive ? 'bg-bg-primary border-2 text-text-primary shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 
                        'bg-bg-secondary border border-border-subtle text-text-muted hover:border-border-accent hover:text-text-secondary'
                      }`}
                      style={isActive ? { borderColor: sevColor, color: sevColor } : {}}
                    >
                      {idx + 1}
                    </div>
                    <div className="absolute top-14 text-center w-32">
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>{stage.stage}</div>
                      <div className="text-[9px] font-mono text-text-muted">{stage.technique}</div>
                    </div>
                    {/* Time diff arrow */}
                    {idx < kc.length - 1 && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-[3.5rem] w-20 flex flex-col items-center -mt-4 text-[8px] text-text-muted font-mono pointer-events-none">
                        T+0:0{(idx+1)*2}
                        <ChevronRight size={12} className="text-border-accent mt-0.5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Stage Detail Card */}
            {kc[activeStage] && (
              <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6 mb-8 shadow-xl animate-fade">
                <div className="flex justify-between items-start mb-6 border-b border-border-subtle pb-4">
                  <div>
                    <div className="text-[10px] tracking-widest text-text-muted font-bold mb-1">STAGE {activeStage + 1} // {kc[activeStage].stage}</div>
                    <h3 className="text-[18px] font-bold text-text-primary">{kc[activeStage].technique_name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-widest text-text-muted font-bold mb-1">TIMESTAMP</div>
                    <div className="font-mono text-[12px] text-text-secondary">{kc[activeStage].timestamp} UTC</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] tracking-widest text-text-muted font-bold mb-3">EVIDENCE RECORDED</div>
                    <ul className="space-y-2">
                      {kc[activeStage].evidence.map((ev, i) => (
                        <li key={i} className="flex gap-2 text-[12px] text-text-secondary">
                          <span className="text-border-accent mt-1">•</span> {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-text-muted font-bold mb-3">AFFECTED ASSET</div>
                    <div className="font-mono text-[12px] text-blue-info bg-blue-dim/20 inline-block px-2 py-1 rounded mb-4">{kc[activeStage].affected_asset}</div>
                    
                    <div className="text-[10px] tracking-widest text-text-muted font-bold mb-3">PRIMARY IOC</div>
                    <div className="font-mono text-[12px] text-red-critical bg-red-dim/20 inline-block px-2 py-1 rounded border border-red-critical/30">{kc[activeStage].ioc}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attacker Context Card */}
            {attacker && (
              <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-5">
                <div className="text-[10px] tracking-widest text-text-muted font-bold mb-4">ATTRIBUTION & CONTEXT</div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-[9px] text-text-muted mb-1">Sophistication</div>
                    <div className="font-bold text-text-primary">{attacker.sophistication}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-muted mb-1">Attribution</div>
                    <div className="font-bold text-text-primary">{attacker.attribution} <span className="text-[9px] text-text-muted font-normal ml-1">({attacker.confidence}%)</span></div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-muted mb-1">Dwell Time</div>
                    <div className="font-bold text-text-primary">{attacker.dwell_time_hours} hours</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-muted mb-1">Data Exfiltrated</div>
                    <div className={`font-bold ${attacker.data_exfiltrated ? 'text-red-critical' : 'text-green-primary'}`}>{attacker.data_exfiltrated ? 'YES' : 'NO'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
