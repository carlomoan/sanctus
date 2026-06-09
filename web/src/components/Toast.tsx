import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem = ({ toast, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'bg-emerald-50/90 border-emerald-200/60 text-emerald-700',
    error: 'bg-red-50/90 border-red-200/60 text-red-700',
    info: 'bg-blue-50/90 border-blue-200/60 text-blue-700',
    warning: 'bg-amber-50/90 border-amber-200/60 text-amber-700',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
  };

  const Icon = icons[toast.type];

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-xl shadow-slate-900/5 ${colors[toast.type]} animate-in slide-in-from-right-5 duration-300 backdrop-blur-md`}>
      <Icon size={20} className={iconColors[toast.type]} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 hover:bg-black/5 transition-colors rounded-lg opacity-60 hover:opacity-100"
      >
        <X size={16} className="currentColor" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
