import { useStore } from '../../stores/useIncidentStore'
import { Timer, Zap, Shield, Activity } from 'lucide-react'

export default function MetricStrip() {
  const { metrics, eventsProcessed, autonomousActions, isSimulating } = useStore()

  const formatEvents = (val: number) => {
    return val > 0 ? val.toLocaleString() : '---' 
  }

  const formatMttr = (val: number) => {
    return val > 0 ? `${val.toFixed(1)}s` : '---' 
  }

  const hasStarted = isSimulating || useStore.getState().simComplete;

  const cards = [
    { icon: Timer, label: 'MEAN TIME TO RESPOND', value: hasStarted ? formatMttr(metrics.mttr) : '---', sub: 'Industry avg: 197 days', color: '#00FF9D', baseColor: 'rgba(0, 255, 157, 0.1)', sparkline: '0,10 5,8 10,12 15,4 20,6 25,1 30,8' },
    { icon: Zap, label: 'EVENTS PROCESSED', value: hasStarted ? formatEvents(eventsProcessed) : '---', sub: 'From 6 data sources', color: '#00E5FF', baseColor: 'rgba(0, 229, 255, 0.1)', sparkline: '0,2 5,5 10,3 15,9 20,4 25,10 30,5' },
    { icon: Shield, label: 'INCIDENTS DETECTED', value: hasStarted && metrics.totalIncidents > 0 ? metrics.totalIncidents.toString() : '---', sub: metrics.totalIncidents > 0 ? `${metrics.criticalCount} Critical · ${metrics.highCount} High · ${metrics.mediumCount} Medium` : 'Awaiting initialization', color: '#E63946', baseColor: 'rgba(230, 57, 70, 0.1)', pills: hasStarted && metrics.totalIncidents > 0, critical: metrics.criticalCount || 0, high: metrics.highCount || 0, medium: metrics.mediumCount || 0 },
    { icon: Activity, label: 'AUTONOMOUS ACTIONS', value: hasStarted && autonomousActions > 0 ? autonomousActions.toString() : '---', sub: metrics.ipsBlocked > 0 ? `${metrics.ipsBlocked} IPs blocked · ${metrics.playbooksRun} playbook` : 'Awaiting initialization', color: '#FF6A00', baseColor: 'rgba(255, 106, 0, 0.1)', sparkline: '0,8 5,3 10,7 15,2 20,8 25,4 30,9' },
  ]

  return (
    <div className="grid grid-cols-4 gap-6 px-6 py-4 shrink-0 bg-[#0B0F19] z-10 relative perspective-1000">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div key={i} className="relative flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 shadow-[0_5px_20px_rgba(0,0,0,0.4)] luxury-gradient overflow-hidden group hover-3d-tilt">
            
            {/* Background Sparkline Glow Effect */}
            {card.sparkline && (
              <svg className="absolute bottom-0 right-0 w-32 h-12 opacity-30 group-hover:opacity-60 transition-opacity" viewBox="0 0 30 15" preserveAspectRatio="none">
                <polyline points={card.sparkline} fill="none" stroke={card.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${card.color})` }} />
                <path d={`M0,15 L0,10 L${card.sparkline.replace(/,/g, ' ')} L30,15 Z`} fill={`url(#gradient-${i})`} opacity="0.4" />
                <defs>
                  <linearGradient id={`gradient-${i}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={card.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={card.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 bg-black/50 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
              <Icon size={28} style={{ color: card.color, filter: `drop-shadow(0 0 12px ${card.color})` }} />
            </div>
            <div className="min-w-0 z-10 pl-2">
              <div className="text-xs font-black tracking-[0.2em] text-white/60 leading-none mb-2 drop-shadow-md">{card.label}</div>
              <div className="text-4xl font-bold font-mono leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {card.value}
              </div>
              <div className="text-xs text-white/50 mt-2 truncate font-semibold drop-shadow-md">
                {card.pills ? (
                  <span className="flex gap-2 mt-1">
                    <span className="badge badge-critical px-2 py-1 text-[10px] tracking-wider bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/40 shadow-[0_0_12px_rgba(255,51,102,0.3)]">{card.critical} CRIT</span>
                    <span className="badge badge-high px-2 py-1 text-[10px] tracking-wider bg-[#FF6A00]/15 text-[#FF6A00] border-[#FF6A00]/40 shadow-[0_0_12px_rgba(255,106,0,0.3)]">{card.high} HIGH</span>
                    <span className="badge badge-medium px-2 py-1 text-[10px] tracking-wider bg-[#FFD93D]/15 text-[#FFD93D] border-[#FFD93D]/40 shadow-[0_0_12px_rgba(255,217,61,0.3)]">{card.medium} MED</span>
                  </span>
                ) : card.sub}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
