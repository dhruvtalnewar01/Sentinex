import { useStore } from '../../stores/useIncidentStore'
import { useState, useEffect, useRef } from 'react'
import { generateTimelineData } from '../../data/simulationData'

export default function EventTimeline() {
  const { isSimulating, incidents } = useStore()
  const [data, setData] = useState(generateTimelineData(60))
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!isSimulating) return
    const interval = setInterval(() => setData(generateTimelineData(60)), 2500)
    return () => clearInterval(interval)
  }, [isSimulating])

  const maxVal = Math.max(...data.map(d => d.events), 1)
  const W = 800; const H = 180;

  const getX = (i: number) => (i / (data.length - 1)) * W
  const getY = (val: number) => H - 16 - (val / maxVal) * (H - 32)

  const makeSmoothPath = (key: 'events' | 'threats') => {
    if (data.length === 0) return '';
    let path = `M ${getX(0)},${getY(data[0][key])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i); const y0 = getY(data[i][key]);
      const x1 = getX(i + 1); const y1 = getY(data[i + 1][key]);
      const cp1x = x0 + (x1 - x0) / 2;
      const cp2x = x0 + (x1 - x0) / 2;
      path += ` C ${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
    }
    return path;
  }

  const eventsPath = makeSmoothPath('events');
  const eventsArea = `${eventsPath} L ${W},${H - 16} L 0,${H - 16} Z`;
  const threatsPath = makeSmoothPath('threats');

  const hasStarted = isSimulating || useStore.getState().simComplete;

  return (
    <div className="p-6 h-full flex flex-col luxury-gradient relative">
      <div className="flex items-center justify-between mb-4 z-10">
        <span className="text-xs tracking-widest text-[#00E5FF] font-bold drop-shadow-md"><span className="text-white/30 mr-2">▸</span> EVENT TIMELINE — 60 MIN</span>
        <div className="flex gap-4 text-[10px] font-bold tracking-wider">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_#00E5FF]" style={{ background: '#00E5FF' }} /><span className="text-white/60">Events</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_#FF3366]" style={{ background: '#FF3366' }} /><span className="text-white/60">Threats</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shadow-[0_0_8px_#4ADE80]" style={{ background: '#4ADE80' }} /><span className="text-white/60">Blocked</span></div>
        </div>
      </div>
      <div className="flex-1 relative z-10">
        {!hasStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 font-mono tracking-widest text-sm bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="w-12 h-12 mb-4 border border-white/10 rounded-full flex items-center justify-center bg-white/5 shadow-inner">
              <span className="text-lg opacity-50">?</span>
            </div>
            <span>AWAITING TARGET INITIALIZATION</span>
          </div>
        ) : (
          <>
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = svgRef.current?.getBoundingClientRect()
                if (!rect) return
                const x = ((e.clientX - rect.left) / rect.width) * data.length
                setHover(Math.min(Math.max(Math.floor(x), 0), data.length - 1))
              }}
              onMouseLeave={() => setHover(null)}
              className="overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            >
              <defs>
                <linearGradient id="evG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Grid */}
              {[0, 45, 90, 135].map(y => <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />)}
              {/* Events area + line */}
              <path d={eventsArea} fill="url(#evG)" />
              <path d={eventsPath} fill="none" stroke="#00E5FF" strokeWidth="2" filter="url(#glow)" />
              {/* Threats line */}
              <path d={threatsPath} fill="none" stroke="#FF3366" strokeWidth="2" opacity="0.9" filter="url(#glow)" />
              {/* Blocked dots */}
              {data.filter((_, i) => i % 4 === 0).map((d, idx) => {
                const i = data.indexOf(d)
                return <circle key={idx} cx={getX(i)} cy={getY(d.blocked)} r="3" fill="#4ADE80" opacity="0.8" filter="url(#glow)" />
              })}
              {/* Hover line + tooltip */}
              {hover !== null && (
                <>
                  <line x1={getX(hover)} y1="0" x2={getX(hover)} y2={H} stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx={getX(hover)} cy={getY(data[hover].events)} r="5" fill="#0B0F19" stroke="#00E5FF" strokeWidth="2" filter="url(#glow)" />
                  <circle cx={getX(hover)} cy={getY(data[hover].threats)} r="4" fill="#FF3366" filter="url(#glow)" />
                </>
              )}
            </svg>
            {/* Hover tooltip */}
            {hover !== null && (
              <div className="absolute top-2 pointer-events-none bg-[#151A28]/95 border border-[#00E5FF]/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-lg px-4 py-3 text-xs z-50 transition-all duration-75"
                style={{ left: Math.min(getX(hover) * (svgRef.current?.getBoundingClientRect().width || W) / W, svgRef.current?.getBoundingClientRect().width ? svgRef.current.getBoundingClientRect().width - 120 : W - 120) }}>
                <div className="font-mono text-white font-bold mb-2 pb-1 border-b border-white/10">{data[hover].time}</div>
                <div className="text-[#00E5FF] font-medium tracking-wide flex justify-between gap-4 mb-1"><span>Events:</span> <span>{data[hover].events}</span></div>
                <div className="text-[#FF3366] font-medium tracking-wide flex justify-between gap-4 mb-1"><span>Threats:</span> <span>{data[hover].threats}</span></div>
                <div className="text-[#4ADE80] font-medium tracking-wide flex justify-between gap-4"><span>Blocked:</span> <span>{data[hover].blocked}</span></div>
              </div>
            )}
            {/* Time labels */}
            <div className="absolute bottom-[-10px] left-0 right-0 flex justify-between text-[10px] text-white/40 font-mono tracking-widest px-2">
              <span>{data[0]?.time}</span><span>{data[Math.floor(data.length / 2)]?.time}</span><span>{data[data.length - 1]?.time}</span>
            </div>
          </>
        )}
      </div>
      {/* Severity distribution bar */}
      {hasStarted && incidents.length > 0 && (
        <div className="flex h-1.5 mt-5 rounded-full overflow-hidden gap-1 opacity-90 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          {incidents.filter(i => i.severity === 'CRITICAL').length > 0 && <div className="flex-1 bg-[#FF3366]" />}
          {incidents.filter(i => i.severity === 'HIGH').length > 0 && <div className="flex-1 bg-[#FF6A00]" />}
          {incidents.filter(i => i.severity === 'MEDIUM').length > 0 && <div className="flex-1 bg-[#FFD93D]" />}
        </div>
      )}
    </div>
  )
}
