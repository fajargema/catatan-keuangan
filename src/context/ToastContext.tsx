"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 360,
          width: "calc(100vw - 48px)",
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const icons: Record<ToastType, ReactNode> = {
    success: <Check size={15} strokeWidth={3} />,
    error: <X size={15} strokeWidth={3} />,
    info: <Info size={15} strokeWidth={2.5} />,
  };

  const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
      bg: "color-mix(in srgb, var(--color-income) 12%, transparent)",
      border: "color-mix(in srgb, var(--color-income) 30%, transparent)",
      icon: "var(--color-income)",
      text: "var(--color-income)",
    },
    error: {
      bg: "color-mix(in srgb, var(--color-expense) 12%, transparent)",
      border: "color-mix(in srgb, var(--color-expense) 30%, transparent)",
      icon: "var(--color-expense)",
      text: "var(--color-expense)",
    },
    info: {
      bg: "color-mix(in srgb, var(--accent-blue) 12%, transparent)",
      border: "color-mix(in srgb, var(--accent-blue) 30%, transparent)",
      icon: "var(--accent-blue)",
      text: "var(--accent-blue)",
    },
  };

  const c = colors[toast.type];

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 14,
        background: "var(--modal-bg)",
        border: `1px solid ${c.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: c.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          color: c.icon,
          flexShrink: 0,
        }}
      >
        {icons[toast.type]}
      </div>

      {/* Message */}
      <p
        style={{
          flex: 1,
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--text-primary)",
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          borderRadius: 6,
          flexShrink: 0,
        }}
        aria-label="Tutup notifikasi"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return context;
}
