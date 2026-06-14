import { useStore } from '../../stores/useIncidentStore'

export default function AgentPipeline() {
  const { agents } = useStore()

  return (
    <div className="p-6 h-full flex flex-col luxury-gradient relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#A78BFA]/5 blur-[100px] pointer-events-none" />
      
      <div className="text-[11px] tracking-widest text-white/60 font-bold mb-4 flex items-center gap-2 z-10">
        <span className="text-[#A78BFA]">▸</span> AGENT PIPELINE
        <span className="text-[#00FF9D] bg-[#00FF9D]/10 px-2 py-0.5 rounded ml-2 border border-[#00FF9D]/20 shadow-[0_0_10px_rgba(0,255,157,0.1)]">5 NODES</span>
      </div>
      <div className="flex items-center gap-2 flex-1 relative z-10 perspective-1000">
        {agents.map((agent, idx) => {
          const isActive = agent.status === 'ACTIVE'
          const isDone = agent.status === 'DONE'
          return (
            <div key={agent.key} className="contents">
              {/* 3D Agent Card */}
              <div
                className={`flex-1 rounded-xl px-4 py-3 flex flex-col justify-between transition-all duration-300 min-w-[160px] h-full hover-3d-tilt ${
                  isActive ? 'border border-[#00E5FF]/40 bg-[#00E5FF]/5 shadow-[0_10px_30px_rgba(0,229,255,0.15)] glow-panel' :
                  isDone ? 'border border-white/10 bg-[#151A28]/80 shadow-[0_5px_15px_rgba(0,0,0,0.3)]' :
                  'border border-white/5 bg-[#0D111C]/50 opacity-80'
                }`}
                style={isActive ? { borderTopWidth: '2px', borderTopColor: '#00E5FF' } : {}}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg leading-none opacity-90 drop-shadow-md">{agent.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-pulse-dot' : 
                        isDone ? 'bg-[#4ADE80] opacity-50' : 'bg-white/20'
                      }`} />
                      <span className={`text-[9px] tracking-widest font-bold ${
                        isActive ? 'text-[#00E5FF]' : isDone ? 'text-[#4ADE80] opacity-50' : 'text-white/30'
                      }`}>{agent.status}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white drop-shadow-sm' : 'text-white/80'}`}>{agent.name}</div>
                  <div className="text-[10px] text-white/50 mt-1 truncate">{agent.description}</div>
                </div>
                {/* Activity log */}
                {agent.activity && (
                  <div className="text-[10px] font-mono mt-2 truncate leading-tight font-medium" style={{ color: isActive ? '#00E5FF' : 'rgba(255,255,255,0.5)' }}>→ {agent.activity}</div>
                )}
                <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/10">
                  <div><div className="text-[9px] text-white/40 tracking-widest">PROC</div><div className="text-xs font-mono font-bold" style={{ color: agent.processed > 0 ? (isActive ? '#00E5FF' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.2)' }}>{agent.processed}</div></div>
                  <div className="text-right"><div className="text-[9px] text-white/40 tracking-widest">LATENCY</div><div className="text-xs font-mono font-bold text-white/60">{agent.avgLatency > 0 ? `${agent.avgLatency.toFixed(0)}ms` : '—'}</div></div>
                </div>
              </div>
              {/* Arrow between agents */}
              {idx < agents.length - 1 && (
                <div className="w-8 flex flex-col items-center justify-center shrink-0 relative h-full">
                  {/* Razor thin vector line */}
                  <div className={`absolute top-1/2 left-0 right-0 h-[1px] transform -translate-y-1/2 ${
                    isActive ? 'bg-gradient-to-r from-[#00E5FF]/80 to-[#00E5FF]/20 shadow-[0_0_8px_#00E5FF]' :
                    isDone ? 'bg-[#4ADE80]/40' : 'bg-white/10'
                  }`} />
                  {isActive && (
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] transform -translate-y-1/2 overflow-hidden">
                      <div className="w-full h-full bg-[#00E5FF] animate-[green-sweep_1s_linear_infinite]" />
                    </div>
                  )}
                  {/* Arrow head */}
                  <div className={`absolute top-1/2 right-1 transform -translate-y-1/2 translate-x-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] ${
                    isActive ? 'border-l-[#00E5FF]' : isDone ? 'border-l-[#4ADE80]/60' : 'border-l-white/20'
                  }`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
