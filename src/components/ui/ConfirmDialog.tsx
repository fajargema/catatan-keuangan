"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEscapeKey(onCancel);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="modal-content !max-w-sm"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "28px" }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background:
                variant === "danger"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
              border:
                variant === "danger"
                  ? "1px solid rgba(239, 68, 68, 0.2)"
                  : "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            {variant === "danger" ? (
              <Trash2
                size={24}
                style={{ color: variant === "danger" ? "#ef4444" : "#f59e0b" }}
              />
            ) : (
              <AlertTriangle size={24} style={{ color: "#f59e0b" }} />
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-card-hover transition-colors text-muted"
          style={{ position: "absolute", top: "16px", right: "16px" }}
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
            id="confirm-dialog-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={variant === "danger" ? "btn-danger flex-1" : "btn-primary flex-1"}
            id="confirm-dialog-confirm"
            style={
              variant === "warning"
                ? {
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }
                : undefined
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
