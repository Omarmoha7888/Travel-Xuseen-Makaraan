import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now();
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-2xl border text-xs leading-relaxed transition-all transform animate-in slide-in-from-bottom-2 duration-200 backdrop-blur-md ${
                isError
                  ? 'bg-[#1a0808]/95 border-red-500/50 text-red-200'
                  : isSuccess
                  ? 'bg-[#061c12]/95 border-emerald-500/50 text-emerald-200'
                  : isWarning
                  ? 'bg-[#221606]/95 border-amber-500/50 text-amber-200'
                  : 'bg-[#0d1424]/95 border-slate-700/80 text-slate-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <XCircle className="w-4 h-4 text-red-400" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isWarning && <AlertCircle className="w-4 h-4 text-amber-400" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-400" />}
              </div>

              <div className="flex-1 font-medium text-xs break-words">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
