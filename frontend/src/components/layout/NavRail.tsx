import { useStore } from '../../stores/useIncidentStore'
import { LayoutDashboard, Link2, MessageSquare, ClipboardList } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'killchain', icon: Link2, label: 'Kill Chain' },
  { key: 'query', icon: MessageSquare, label: 'NL Query' },
  { key: 'audit', icon: ClipboardList, label: 'Audit Trail' },
]

export default function NavRail() {
  const { activeTab, setActiveTab, metrics } = useStore()

  return (
    <nav className="w-[60px] shrink-0 flex flex-col items-center py-4 border-r border-white/5 bg-[#0D111C]">
      <div className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.map(item => {
          const active = activeTab === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`relative w-11 h-11 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 cursor-pointer ${
                active ? 'text-[#00E5FF] bg-[#00E5FF]/10 shadow-inner shadow-[#00E5FF]/20' : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
              title={item.label}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[7px] font-bold tracking-widest leading-none">{item.label.split(' ')[0].toUpperCase()}</span>
            </button>
          )
        })}
      </div>
      {/* Bottom: Badge */}
      <div className="relative w-11 h-11 rounded-xl bg-[#151A28] border border-white/5 flex flex-col items-center justify-center">
        <span className="text-[12px] font-bold text-white/50">{metrics.totalIncidents}</span>
        {metrics.criticalCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E63946] border-2 border-[#0D111C] text-[8px] font-bold flex items-center justify-center text-white shadow-[0_0_10px_#E63946] animate-pulse-dot">{metrics.criticalCount}</div>
        )}
      </div>
      <div className="mt-4 text-[9px] font-bold text-white/20 tracking-widest">v3.0</div>
    </nav>
  )
}
