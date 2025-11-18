import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { createPortal } from 'react-dom';

type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  txHash?: string;
  duration?: number; // ms
}

interface ToastItem extends Required<ToastOptions> {
  id: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: ToastOptions) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const item: ToastItem = {
      id,
      type: opts.type ?? "info",
      title: opts.title ?? (opts.type === "success" ? "Success" : opts.type === "error" ? "Error" : "Info"),
      description: opts.description ?? "",
      txHash: opts.txHash ?? "",
      duration: opts.duration ?? 6000,
    };
    setToasts((t) => [...t, item]);
    if (item.duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, item.duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div aria-live="polite" role="status" className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-[360px] pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-md p-3 shadow-md break-words border pointer-events-auto ${
                t.type === "success" ? "bg-green-800 text-green-100 border-green-700" : t.type === "error" ? "bg-red-800 text-red-100 border-red-700" : "bg-gray-800 text-gray-100 border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{t.title}</div>
                  {t.description && <div className="text-xs mt-1">{t.description}</div>}
                  {t.txHash && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <a
                        href={`https://testnet.bscscan.com/tx/${t.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        View Tx
                      </a>
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(t.txHash);
                          } catch (e) {
                            // ignore
                          }
                        }}
                        className="underline"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => dismiss(t.id)} className="text-xs opacity-70">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export default ToastProvider;
