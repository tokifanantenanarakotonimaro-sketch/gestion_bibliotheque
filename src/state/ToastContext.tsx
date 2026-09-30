import { createContext, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error';
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastContextValue = { showToast: (message: string, tone?: ToastTone) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  function showToast(message: string, tone: ToastTone = 'success') {
    const id = Date.now();
    setToasts(current => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 3500);
  }
  return <ToastContext.Provider value={{ showToast }}>{children}<div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map(toast => <div className={`toast toast-${toast.tone}`} key={toast.id}><span className="toast-icon">{toast.tone === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span><span>{toast.message}</span><button type="button" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))} aria-label="Fermer la notification"><X size={14} /></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider');
  return context;
}