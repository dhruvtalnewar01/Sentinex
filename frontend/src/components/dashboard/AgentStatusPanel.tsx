import { useStore } from '../../stores/useIncidentStore'

export default function AgentPipeline() {
  const { agents } = useStore()

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="text-[9px] tracking-widest text-text-muted font-bold mb-2 flex items-center gap-2">
        <span>▸ AGENT PIPELINE</span>
        <span className="text-green-primary">5 NODES</span>
      </div>
      <div className="flex items-center gap-0 flex-1">
        {agents.map((agent, idx) => {
          const isActive = agent.status === 'ACTIVE'
          const isDone = agent.status === 'DONE'
          return (
            <div key={agent.key} className="contents">
              {/* Agent Card */}
              <div
                className={`flex-1 rounded-md border px-2.5 py-2 flex flex-col justify-between transition-all duration-300 min-w-0 ${
                  isActive ? 'border-green-primary/30 bg-green-dim/30' :
                  isDone ? 'border-green-secondary/20 bg-bg-tertiary/50' :
                  'border-border-subtle bg-bg-tertiary/30'
                }`}
                style={isActive ? { boxShadow: '0 0 12px rgba(6,255,165,0.15)', borderTopWidth: '2px', borderTopColor: '#06FFA5' } : {}}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm leading-none">{agent.icon}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-green-primary animate-pulse-dot' : isDone ? 'bg-green-secondary' : 'bg-text-muted/40'
                      }`} />
                      <span className={`text-[7px] tracking-wider font-bold ${
                        isActive ? 'text-green-primary' : isDone ? 'text-green-secondary' : 'text-text-muted'
                      }`}>{agent.status}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-text-primary leading-tight truncate">{agent.name}</div>
                  <div className="text-[8px] text-text-muted">{agent.description}</div>
                </div>
                {/* Activity log */}
                {agent.activity && (
                  <div className="text-[8px] font-mono text-text-muted mt-1 truncate leading-tight" style={{ color: agent.color }}>→ {agent.activity}</div>
                )}
                <div className="flex justify-between items-end mt-1.5 pt-1.5 border-t border-border-subtle/50">
                  <div><div className="text-[7px] text-text-muted tracking-wider">PROC</div><div className="text-[10px] font-mono font-bold" style={{ color: agent.processed > 0 ? agent.color : 'rgba(255,255,255,0.2)' }}>{agent.processed}</div></div>
                  <div className="text-right"><div className="text-[7px] text-text-muted tracking-wider">MS</div><div className="text-[10px] font-mono font-bold text-text-muted">{agent.avgLatency > 0 ? agent.avgLatency.toFixed(0) : '—'}</div></div>
                </div>
              </div>
              {/* Arrow between agents */}
              {idx < agents.length - 1 && (
                <div className={`w-6 flex items-center justify-center shrink-0 ${
                  isActive ? 'flow-arrow flow-arrow-active' :
                  isDone ? 'flow-arrow flow-arrow-done' :
                  'flow-arrow flow-arrow-idle'
                }`} style={{ height: '100%' }}>
                  {!(isActive) && <span />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
