import { useStore } from '../../stores/useIncidentStore'

export default function StatusBar() {
  const { eventsProcessed, metrics, simComplete } = useStore()
  return (
    <div className="h-8 shrink-0 flex items-center px-4 gap-6 text-[10px] tracking-widest font-mono font-bold border-t border-white/5 bg-[#0B0F19] z-50">
      <span className="text-white/30">EVENTS <strong className="text-white/80">{eventsProcessed.toLocaleString()}</strong></span>
      
      <div className="flex items-center gap-4 border-l border-white/5 pl-6">
        <span className="flex items-center gap-1.5 text-white/30">KAFKA <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_5px_#00FF9D]" /></span>
        <span className="flex items-center gap-1.5 text-white/30">CHROMA <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_5px_#00FF9D]" /></span>
        <span className="flex items-center gap-1.5 text-white/30">NEO4J <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_5px_#00FF9D]" /></span>
        <span className="flex items-center gap-1.5 text-white/30">API <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_5px_#00FF9D]" /></span>
      </div>

      <div className="flex-1" />
      {simComplete && <span className="text-white/30 border-r border-white/5 pr-6">MTTR <strong className="text-[#00FF9D]">{metrics.mttr.toFixed(1)}s</strong> vs Industry 197 days</span>}
      <span className="text-white/20">© SENTINEX 2026</span>
    </div>
  )
}
