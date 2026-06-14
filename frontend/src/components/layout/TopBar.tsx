import { useStore } from '../../stores/useIncidentStore'
import { Shield, Zap, Home } from 'lucide-react'
import { useState } from 'react'

export default function TopBar() {
  const { startSimulation, isSimulating, simComplete, simulationPhase, mttrTimer, mttrRunning, eventsProcessed, agentRounds, autonomousActions, setAppView, targetUrl, setTargetUrl } = useStore()

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border-subtle shadow-[0_5px_20px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
      {/* Left: Brand & Nav */}
      <div className="flex items-center gap-3 w-1/4">
        <button 
          onClick={() => setAppView('landing')}
          className="flex items-center justify-center w-8 h-8 rounded bg-white/5 border border-white/10 text-white/50 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-colors mr-2 click-glow"
          title="Back to Home"
        >
          <Home size={16} />
        </button>
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-black text-bg-primary shadow-[0_0_15px_rgba(6,255,165,0.4)]" style={{ background: 'linear-gradient(135deg, #60A5FA, #06FFA5)' }}>S</div>
        <span className="text-sm font-bold tracking-[0.15em] text-text-primary drop-shadow-md hidden sm:inline-block">SENTINEX</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-text-muted bg-white/5 hidden md:inline-block">v3.0</span>
      </div>

      {/* Center: Input + Button (Main USP) */}
      <div className="flex items-center justify-center gap-6 flex-1">
        {!isSimulating && !simComplete && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF] to-[#A78BFA] rounded-md blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <input 
              type="url" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Target Service URL / IP"
              className="relative w-64 md:w-80 bg-[#0A0E1A]/80 backdrop-blur-sm border border-white/20 rounded-md px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946] focus:shadow-[0_0_15px_rgba(230,57,70,0.5)] transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
            />
          </div>
        )}

        <div className="flex items-center gap-2 px-2">
          <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${isSimulating ? 'bg-[#E63946] text-[#E63946] animate-pulse-dot' : 'bg-[#00FF9D] text-[#00FF9D] animate-pulse-dot'}`} />
          <span className="text-xs font-black tracking-[0.2em] text-white/70">{isSimulating ? 'PROCESSING' : 'LIVE'}</span>
        </div>

        <button
          onClick={startSimulation}
          disabled={isSimulating || (!simComplete && targetUrl.trim() === '')}
          className={`relative group flex items-center gap-2 px-6 py-2 text-xs font-black tracking-[0.1em] rounded-md transition-all duration-300 cursor-pointer overflow-hidden ${
            isSimulating || (!simComplete && targetUrl.trim() === '')
              ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
              : simComplete
              ? 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10'
              : 'bg-[#0A0E1A] border border-[#E63946]/50 text-[#E63946] hover:text-white shadow-[0_0_20px_rgba(230,57,70,0.2)] hover:shadow-[0_0_30px_rgba(230,57,70,0.6)]'
          }`}
        >
          {/* 3D hover fill effect */}
          {(!isSimulating && !simComplete && targetUrl.trim() !== '') && (
            <div className="absolute inset-0 bg-[#E63946] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out -z-10"></div>
          )}
          
          {isSimulating ? (
            <><div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" /> SIMULATING...</>
          ) : simComplete ? (
            <><Zap size={16} /> RUN AGAIN</>
          ) : (
            <><Shield size={16} className="relative z-10" /> <span className="relative z-10">LAUNCH ATTACK SIM</span></>
          )}
        </button>
      </div>

      {/* Right: MTTR + Phase */}
      <div className="flex items-center gap-4 w-1/4 justify-end">
        {simulationPhase && (
          <span className="text-[10px] text-white/40 font-mono truncate max-w-[200px] hidden lg:inline-block">{simulationPhase}</span>
        )}
        {(mttrRunning || mttrTimer > 0) && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.02] border border-white/10 shadow-inner">
            <span className="text-[9px] font-bold tracking-wider text-white/40">MTTR</span>
            <span className={`font-mono text-lg font-bold tabular-nums ${mttrRunning ? 'text-[#FFD93D] drop-shadow-[0_0_8px_rgba(255,217,61,0.5)]' : 'text-[#00FF9D] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]'}`}>
              {mttrTimer.toFixed(1)}s
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
