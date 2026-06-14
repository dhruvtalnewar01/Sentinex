import { useStore } from '../../stores/useIncidentStore'
import type { Toast } from '../../stores/useIncidentStore'
import { X, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function ToastSystem() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none w-80">
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  const cfg = {
    INFO: { icon: Info, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.4)' },
    WARNING: { icon: AlertTriangle, color: '#FFD93D', bg: 'rgba(255,217,61,0.1)', border: 'rgba(255,217,61,0.4)' },
    CRITICAL: { icon: ShieldAlert, color: '#FF4757', bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.4)' },
    SUCCESS: { icon: CheckCircle2, color: '#06FFA5', bg: 'rgba(6,255,165,0.1)', border: 'rgba(6,255,165,0.4)' },
  }[toast.type]

  const Icon = cfg.icon

  return (
    <div 
      className="pointer-events-auto overflow-hidden bg-[#1A1F2E] border border-border-subtle rounded-lg shadow-2xl animate-slide-right relative"
      style={{ borderLeft: `4px solid ${cfg.color}` }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <Icon size={16} style={{ color: cfg.color }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-text-primary leading-tight mb-1">{toast.title}</h4>
            {toast.message && <p className="text-[10px] text-text-secondary leading-snug">{toast.message}</p>}
            {toast.action && (
              <button 
                onClick={() => { toast.action?.onClick(); onClose(); }}
                className="mt-2 px-3 py-1 rounded bg-bg-tertiary border border-border-accent text-[9px] font-bold text-text-primary hover:bg-bg-hover transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-text-muted hover:text-white mt-0.5">
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {toast.autoDismiss && toast.duration > 0 && (
        <div className="h-0.5 w-full bg-border-subtle absolute bottom-0 left-0">
          <div 
            className="h-full" 
            style={{ 
              background: cfg.color, 
              animation: `progress-bar ${toast.duration}ms linear forwards` 
            }} 
          />
        </div>
      )}
    </div>
  )
}
