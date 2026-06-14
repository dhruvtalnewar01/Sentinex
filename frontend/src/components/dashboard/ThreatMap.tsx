import { useStore } from '../../stores/useIncidentStore'
import { ATTACK_ORIGINS, HQ_LOCATION } from '../../data/simulationData'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function ThreatMap() {
  const { incidents, threatMapExpanded, toggleThreatMap } = useStore()
  if (incidents.length === 0) return null

  // Simple Mercator-ish projection for SVG world map
  const project = (lat: number, lon: number): [number, number] => {
    const x = ((lon + 180) / 360) * 800
    const y = ((90 - lat) / 180) * 400
    return [x, y]
  }

  const hq = project(HQ_LOCATION.lat, HQ_LOCATION.lon)
  const sevColor: Record<string, string> = { CRITICAL: '#FF4757', HIGH: '#FF7B25', MEDIUM: '#FFD93D' }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <span className="text-[10px] tracking-widest text-text-muted font-bold">THREAT ORIGIN MAP</span>
        <span className="text-[10px] font-mono text-[#FF3366] glow-pulse">{ATTACK_ORIGINS.length} SOURCES DETECTED</span>
      </div>
      <div className="flex-1 p-2 relative">
        <svg viewBox="0 0 800 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,255,157,0.1)]">
          {/* Simplified world outline */}
          <ellipse cx="400" cy="200" rx="380" ry="180" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Continent hints */}
          {[[120,120,80,60],[280,140,100,50],[450,100,60,80],[350,260,50,60],[600,150,80,90],[180,280,40,40]].map(([cx,cy,rx,ry], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          ))}
          {/* Grid */}
          {[100,200,300].map(y => <line key={y} x1="20" y1={y} x2="780" y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />)}
          {[200,400,600].map(x => <line key={x} x1={x} y1="20" x2={x} y2="380" stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />)}
          {/* HQ target */}
          <polygon points={`${hq[0]},${hq[1]-6} ${hq[0]+5},${hq[1]} ${hq[0]},${hq[1]+6} ${hq[0]-5},${hq[1]}`} fill="#00FF9D" opacity="0.8" />
          <text x={hq[0]+8} y={hq[1]+3} fill="#00FF9D" fontSize="8" fontFamily="monospace">HQ</text>
          {/* Attack origins + animated lines */}
          {ATTACK_ORIGINS.map((origin, i) => {
            const pos = project(origin.lat, origin.lon)
            const color = sevColor[origin.severity] || '#FFD93D'
            return (
              <g key={i}>
                {/* Attack line */}
                <line x1={pos[0]} y1={pos[1]} x2={hq[0]} y2={hq[1]} stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="6 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
                </line>
                {/* Pulsing origin circle */}
                <circle cx={pos[0]} cy={pos[1]} r="6" fill={color} opacity="0.15">
                  <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={pos[0]} cy={pos[1]} r="3" fill={color} opacity="0.9" />
                {/* Label */}
                <text x={pos[0]+8} y={pos[1]-4} fill={color} fontSize="8" fontFamily="monospace" opacity="0.9">{origin.ip}</text>
                <text x={pos[0]+8} y={pos[1]+5} fill="rgba(255,255,255,0.6)" fontSize="7" fontFamily="monospace">{origin.country}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
