"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatRupiahInput, getErrorMessage } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Investment, InvestmentType } from "@/lib/types";

interface InvestmentFormProps {
  investment?: Investment | null;
  onSubmit: (data: {
    name: string;
    type: InvestmentType;
    current_val: number;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const INVESTMENT_TYPES: { value: InvestmentType; label: string; icon: string }[] = [
  { value: "saham", label: "Saham", icon: "📈" },
  { value: "reksadana", label: "Reksadana", icon: "💼" },
  { value: "crypto", label: "Crypto", icon: "🪙" },
  { value: "emas", label: "Emas / Logam Mulia", icon: "✨" },
  { value: "obligasi", label: "Obligasi / SBN", icon: "📜" },
  { value: "lainnya", label: "Lainnya", icon: "💰" },
];

export default function InvestmentForm({ investment, onSubmit, onClose }: InvestmentFormProps) {
  // Pre-fill saat edit — form selalu di-mount ulang per aset (lihat key di call site)
  const [name, setName] = useState(investment?.name ?? "");
  const [type, setType] = useState<InvestmentType>(investment?.type ?? "saham");
  const [currentVal, setCurrentVal] = useState(
    investment ? investment.current_val.toLocaleString("id-ID") : ""
  );
  const [notes, setNotes] = useState(investment?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama aset investasi wajib diisi");
      return;
    }

    const valNum = Number(currentVal.replace(/\D/g, "")) || 0;

    try {
      setSubmitting(true);
      setError(null);
      
      await onSubmit({
        name: name.trim(),
        type,
        current_val: valNum,
        notes: notes.trim() || undefined,
      });
      
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menyimpan investasi"));
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!investment;

  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Ubah Aset Investasi" : "Tambah Aset Investasi"}
        className="modal-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            {isEdit ? "Ubah Aset Investasi" : "Tambah Aset Investasi"}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Nama Aset / Instrumen
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Contoh: Saham BBCA, Bitcoin, Reksa Dana Sucor"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Jenis Instrumen
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INVESTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 border text-sm transition-all cursor-pointer ${
                    type === t.value
                      ? "bg-accent/15 border-accent text-accent font-semibold scale-[1.02]"
                      : "bg-card border-card-border hover:border-muted text-foreground"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Nilai Aset Saat Ini (Rp)
            </label>
            <input
              type="text"
              value={currentVal}
              onChange={(e) => setCurrentVal(formatRupiahInput(e.target.value))}
              className="form-input"
              placeholder="Rp 0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Catatan / Memo (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input min-h-[70px] resize-none"
              placeholder="Tambahkan detail tambahan..."
            />
          </div>

          <div className="flex gap-3 pt-3">
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
            >
              {submitting ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Tambah")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
