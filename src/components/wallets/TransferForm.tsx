"use client";

import { useState, useMemo } from "react";
import { X, ArrowRight, AlertCircle } from "lucide-react";
import { formatRupiah, formatRupiahInput, getToday } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Wallet } from "@/lib/types";
import CustomSelect from "@/components/ui/CustomSelect";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

interface TransferFormProps {
  wallets: Wallet[];
  onSubmit: (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    date: string,
    notes?: string
  ) => Promise<void>;
  onClose: () => void;
}

export default function TransferForm({
  wallets,
  onSubmit,
  onClose,
}: TransferFormProps) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getToday());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const numericAmount = Number(amount.replace(/\D/g, ""));
  const isBalanceInsufficient = fromWallet && numericAmount > fromWallet.balance && numericAmount > 0;

  const fromWalletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id,
        label: w.name,
        icon: w.icon,
        disabled: w.id === toWalletId,
      })),
    [wallets, toWalletId]
  );

  const toWalletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id,
        label: w.name,
        icon: w.icon,
        disabled: w.id === fromWalletId,
      })),
    [wallets, fromWalletId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWalletId || !toWalletId) {
      setError("Pilih dompet asal dan tujuan");
      return;
    }
    if (fromWalletId === toWalletId) {
      setError("Dompet asal dan tujuan tidak boleh sama");
      return;
    }
    if (!amount || numericAmount <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(fromWalletId, toWalletId, numericAmount, date, notes.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan transfer");
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
        aria-label="Transfer Antar Dompet"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Transfer Antar Dompet</h2>
            <p className="text-xs text-muted mt-0.5">Pindahkan saldo dari satu dompet ke dompet lain</p>
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
          <div className="mb-4 p-3 rounded-lg bg-expense/10 border border-expense/20 text-expense text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Wallet Selector — From → To */}
          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Transfer Dari → Ke
            </label>
            <div className="flex items-center gap-3">
              {/* From */}
              <div className="flex-1">
                <CustomSelect
                  value={fromWalletId}
                  onChange={setFromWalletId}
                  options={fromWalletOptions}
                  placeholder="Pilih dompet asal..."
                  id="transfer-from-wallet"
                  showDefaultOption={false}
                />
                {fromWallet && (
                  <p className="text-[10px] text-muted mt-1 pl-1">
                    Saldo: {formatRupiah(fromWallet.balance)}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-primary-dim)", border: "1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)" }}>
                <ArrowRight size={16} className="text-accent" />
              </div>

              {/* To */}
              <div className="flex-1">
                <CustomSelect
                  value={toWalletId}
                  onChange={setToWalletId}
                  options={toWalletOptions}
                  placeholder="Pilih dompet tujuan..."
                  id="transfer-to-wallet"
                  showDefaultOption={false}
                />
                {toWallet && (
                  <p className="text-[10px] text-muted mt-1 pl-1">
                    Saldo: {formatRupiah(toWallet.balance)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Jumlah (Rp)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
              className="form-input"
              placeholder="Rp 0"
              autoFocus
              id="transfer-amount-input"
              style={isBalanceInsufficient ? { borderColor: "rgba(245, 158, 11, 0.5)" } : undefined}
            />
            {isBalanceInsufficient && (
              <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} />
                Jumlah melebihi saldo dompet asal ({formatRupiah(fromWallet!.balance)})
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Tanggal
            </label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              id="transfer-date-picker"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              placeholder="Alasan transfer..."
              id="transfer-notes-input"
            />
          </div>

          {/* Preview */}
          {fromWallet && toWallet && numericAmount > 0 && (
            <div className="p-3 rounded-xl text-xs space-y-1"
              style={{ background: "color-mix(in srgb, var(--accent-primary) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-primary) 14%, transparent)" }}>
              <p className="text-muted font-medium mb-2">Preview Transfer</p>
              <div className="flex justify-between">
                <span className="text-muted">{fromWallet.icon} {fromWallet.name} (setelah)</span>
                <span className={fromWallet.balance - numericAmount < 0 ? "text-expense font-semibold" : "text-foreground font-semibold"}>
                  {formatRupiah(fromWallet.balance - numericAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{toWallet.icon} {toWallet.name} (setelah)</span>
                <span className="text-income font-semibold">
                  {formatRupiah(toWallet.balance + numericAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
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
              disabled={submitting || fromWalletId === toWalletId}
              className="btn-primary flex-1"
              id="transfer-submit-btn"
            >
              {submitting ? "Memproses..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
