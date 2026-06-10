"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.3)",
      icon: "var(--accent-emerald)",
      text: "var(--accent-emerald)",
    },
    error: {
      bg: "rgba(244, 63, 94, 0.12)",
      border: "rgba(244, 63, 94, 0.3)",
      icon: "var(--color-expense)",
      text: "var(--color-expense)",
    },
    info: {
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.3)",
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
          fontSize: 14,
          lineHeight: 1,
          padding: "2px 4px",
          borderRadius: 4,
          flexShrink: 0,
        }}
        aria-label="Tutup notifikasi"
      >
        ✕
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
