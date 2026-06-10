"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WALLET_COLORS } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Source, SourceFormData } from "@/lib/types";

const SOURCE_ICONS = [
  "👤", "💼", "🏪", "🍜", "💻", "🎨", "🚗", "🏠",
  "📦", "🌱", "🎯", "🔧", "📊", "🎓", "🏋️", "✈️",
];

interface SourceFormProps {
  source?: Source | null;
  onSubmit: (data: SourceFormData) => Promise<void>;
  onClose: () => void;
}

export default function SourceForm({ source, onSubmit, onClose }: SourceFormProps) {
  const [name, setName] = useState(source?.name || "");
  const [icon, setIcon] = useState(source?.icon || "🏷️");
  const [color, setColor] = useState(source?.color || "#3b82f6");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setName(source.name);
      setIcon(source.icon);
      setColor(source.color);
    }
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama sumber wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({ name: name.trim(), icon, color });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (err as any)?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={source ? "Edit Sumber" : "Tambah Sumber"}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">
              {source ? "Edit Sumber" : "Tambah Sumber"}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {source ? "Ubah detail sumber dana ini" : "Buat sumber dana baru"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-expense/10 border border-expense/20 text-expense text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card-hover border border-card-border">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              {icon}
            </span>
            <div>
              <p className="font-semibold text-sm" style={{ color }}>
                {name || "Nama Sumber"}
              </p>
              <p className="text-xs text-muted">Preview</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Nama Sumber
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Contoh: Personal, Bisnis Toko, Freelance"
              autoFocus
              id="source-name-input"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Ikon
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === ic
                      ? "bg-accent/20 border-2 border-accent scale-110"
                      : "bg-card-hover border border-card-border hover:border-muted"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "scale-125" : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "3px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
              id="source-submit-btn"
            >
              {submitting ? "Menyimpan..." : source ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
