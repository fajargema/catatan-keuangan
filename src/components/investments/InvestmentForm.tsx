"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatRupiah, formatRupiahInput, getErrorMessage } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Investment, InvestmentType, InvestmentFormData } from "@/lib/types";

interface InvestmentFormProps {
  investment?: Investment | null;
  onSubmit: (data: InvestmentFormData) => Promise<void>;
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

/** Bersihkan input numerik desimal: hanya digit + satu titik. */
function cleanDecimal(value: string): string {
  const v = value.replace(/[^\d.]/g, "");
  const parts = v.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : v;
}

export default function InvestmentForm({ investment, onSubmit, onClose }: InvestmentFormProps) {
  // Pre-fill saat edit — form selalu di-mount ulang per aset (lihat key di call site)
  const [name, setName] = useState(investment?.name ?? "");
  const [type, setType] = useState<InvestmentType>(investment?.type ?? "saham");
  const [currentVal, setCurrentVal] = useState(
    investment ? investment.current_val.toLocaleString("id-ID") : ""
  );
  const [costBasis, setCostBasis] = useState(
    investment?.cost_basis ? investment.cost_basis.toLocaleString("id-ID") : ""
  );
  const [units, setUnits] = useState(
    investment?.units != null ? String(investment.units) : ""
  );
  const [avgPrice, setAvgPrice] = useState(
    investment?.avg_price ? investment.avg_price.toLocaleString("id-ID") : ""
  );
  const [notes, setNotes] = useState(investment?.notes ?? "");
  // Lacak apakah user mengubah modal manual → kalau belum, boleh auto-isi
  const [costTouched, setCostTouched] = useState(!!investment?.cost_basis);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numCurrent = Number(currentVal.replace(/\D/g, "")) || 0;
  const numCost = Number(costBasis.replace(/\D/g, "")) || 0;
  const gain = numCurrent - numCost;
  const gainPct = numCost > 0 ? (gain / numCost) * 100 : 0;

  // Auto-hitung modal = unit × harga rata-rata, selama user belum ubah manual
  const autoFillCost = (u: string, p: string) => {
    if (costTouched) return;
    const unitNum = parseFloat(u);
    const priceNum = Number(p.replace(/\D/g, ""));
    if (unitNum > 0 && priceNum > 0) {
      setCostBasis(Math.round(unitNum * priceNum).toLocaleString("id-ID"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama aset investasi wajib diisi");
      return;
    }

    const unitNum = parseFloat(units);
    const priceNum = Number(avgPrice.replace(/\D/g, "")) || 0;

    try {
      setSubmitting(true);
      setError(null);

      await onSubmit({
        name: name.trim(),
        type,
        current_val: numCurrent,
        cost_basis: numCost,
        units: units.trim() && unitNum > 0 ? unitNum : null,
        avg_price: priceNum > 0 ? priceNum : null,
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

          {/* Nilai sekarang + Modal → dasar untung/rugi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Nilai Saat Ini (Rp)
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
                Modal / Total Investasi (Rp)
              </label>
              <input
                type="text"
                value={costBasis}
                onChange={(e) => {
                  setCostTouched(true);
                  setCostBasis(formatRupiahInput(e.target.value));
                }}
                className="form-input"
                placeholder="Rp 0"
              />
            </div>
          </div>

          {/* Preview untung/rugi */}
          {numCost > 0 && numCurrent > 0 && (
            <div
              className="flex items-center justify-between p-3 rounded-xl text-sm"
              style={{
                background: gain >= 0 ? "var(--color-income-dim)" : "var(--color-expense-dim)",
                border: `1px solid ${
                  gain >= 0
                    ? "color-mix(in srgb, var(--color-income) 25%, transparent)"
                    : "color-mix(in srgb, var(--color-expense) 25%, transparent)"
                }`,
              }}
            >
              <span className="text-muted">{gain >= 0 ? "Keuntungan" : "Kerugian"}</span>
              <span
                className="font-bold tabular-nums"
                style={{ color: gain >= 0 ? "var(--color-income)" : "var(--color-expense)" }}
              >
                {gain >= 0 ? "+" : ""}{formatRupiah(gain)} ({gain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Detail unit (opsional) */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Detail Unit <span className="text-tertiary font-normal">(opsional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                inputMode="decimal"
                value={units}
                onChange={(e) => {
                  const v = cleanDecimal(e.target.value);
                  setUnits(v);
                  autoFillCost(v, avgPrice);
                }}
                className="form-input"
                placeholder="Jumlah unit / lot"
              />
              <input
                type="text"
                value={avgPrice}
                onChange={(e) => {
                  const v = formatRupiahInput(e.target.value);
                  setAvgPrice(v);
                  autoFillCost(units, v);
                }}
                className="form-input"
                placeholder="Harga rata-rata"
              />
            </div>
            {!costTouched && parseFloat(units) > 0 && Number(avgPrice.replace(/\D/g, "")) > 0 && (
              <p className="text-[11px] text-muted mt-1.5">
                Modal terisi otomatis dari unit × harga rata-rata.
              </p>
            )}
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
