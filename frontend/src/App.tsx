import { useEffect } from 'react'
import { useStore } from './stores/useIncidentStore'
import LandingPage from './components/layout/LandingPage'
import TopBar from './components/layout/TopBar'
import NavRail from './components/layout/NavRail'
import StatusBar from './components/layout/StatusBar'
import MetricStrip from './components/dashboard/MetricStrip'
import AgentPipeline from './components/dashboard/AgentPipeline'
import EventTimeline from './components/dashboard/EventTimeline'
import IncidentTable from './components/dashboard/IncidentTable'
import ThreatMap from './components/dashboard/ThreatMap'
import DetailPanel from './components/detail/DetailPanel'
import KillChainView from './components/killchain/KillChainView'
import NLQueryView from './components/query/NLQueryView'
import AuditTrailView from './components/audit/AuditTrailView'
import ToastSystem from './components/ui/ToastSystem'

export default function App() {
  const { appView, activeTab, showDetail, selectedIncident } = useStore()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't add ripple if clicking an input
      if (target.tagName.toLowerCase() === 'input') return;

      const ripple = document.createElement('div');
      ripple.className = 'fixed rounded-full pointer-events-none mix-blend-screen z-[9999] animate-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.background = 'radial-gradient(circle, rgba(0,229,255,0.8) 0%, rgba(0,229,255,0) 70%)';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (appView === 'landing') {
    return <LandingPage />
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <NavRail />
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeTab === 'dashboard' || activeTab === 'incidents' ? (
            <>
              <MetricStrip />
              <div className="border-b border-border-subtle shrink-0">
                <AgentPipeline />
              </div>
              <div className="flex border-b border-border-subtle shrink-0" style={{ height: '220px' }}>
                <div className="flex-1 border-r border-border-subtle overflow-hidden">
                  <EventTimeline />
                </div>
                <div className="w-[450px] overflow-hidden bg-[#0A0E1A]">
                  <ThreatMap />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <IncidentTable />
              </div>
            </>
          ) : activeTab === 'killchain' ? (
            <KillChainView />
          ) : activeTab === 'query' ? (
            <NLQueryView />
          ) : activeTab === 'audit' ? (
            <AuditTrailView />
          ) : null}
        </main>
        {/* Detail Panel */}
        {showDetail && selectedIncident && (
          <div className="w-[380px] shrink-0 border-l border-border-subtle overflow-y-auto bg-bg-secondary animate-slide-right">
            <DetailPanel />
          </div>
        )}
      </div>
      <StatusBar />
      <ToastSystem />

      {/* Post-Attack 3D Overlay */}
      {useStore.getState().showCompletionOverlay && (
        <div className="fixed inset-0 z-[9999] bg-[#0A0E1A]/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative w-[500px] h-[500px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[#00E5FF]/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute w-full h-full border-4 border-[#00E5FF]/50 rounded-full animate-spin-3d" style={{ animationDuration: '3s' }}></div>
            <div className="absolute w-3/4 h-3/4 border-4 border-[#A78BFA]/50 rounded-full animate-spin-3d" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            <h1 className="text-[#00E5FF] text-8xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_30px_#00E5FF] z-10 animate-bounce">
              {useStore.getState().mttrTimer.toFixed(1)}s
            </h1>
            <h2 className="text-white text-2xl font-bold tracking-[0.3em] mt-4 z-10 drop-shadow-md uppercase">
              Attack Mitigated
            </h2>
          </div>
        </div>
      )}
    </div>
  )
}
