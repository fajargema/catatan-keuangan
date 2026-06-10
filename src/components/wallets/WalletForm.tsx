"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WALLET_ICONS, WALLET_COLORS, formatRupiahInput } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Wallet, WalletFormData } from "@/lib/types";

interface WalletFormProps {
  wallet?: Wallet | null;
  onSubmit: (data: WalletFormData) => Promise<void>;
  onClose: () => void;
}

export default function WalletForm({ wallet, onSubmit, onClose }: WalletFormProps) {
  const [name, setName] = useState(wallet?.name || "");
  const [icon, setIcon] = useState(wallet?.icon || "💰");
  const [color, setColor] = useState(wallet?.color || "#10b981");
  const [balance, setBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setIcon(wallet.icon);
      setColor(wallet.color);
    }
  }, [wallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama dompet wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const submitData: WalletFormData = {
        name: name.trim(),
        icon,
        color,
      };
      if (!wallet && balance) {
        submitData.balance = Number(balance.replace(/\D/g, "")) || 0;
      }
      await onSubmit(submitData);
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
        aria-label={wallet ? "Edit Dompet" : "Tambah Dompet"}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            {wallet ? "Edit Dompet" : "Tambah Dompet"}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Nama Dompet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Contoh: BCA, GoPay, Cash"
              autoFocus
              id="wallet-name-input"
            />
          </div>
 
          {!wallet && (
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Saldo Awal (Rp)
              </label>
              <input
                type="text"
                value={balance}
                onChange={(e) => setBalance(formatRupiahInput(e.target.value))}
                className="form-input"
                placeholder="Rp 0"
                id="wallet-balance-input"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Ikon
            </label>
            <div className="flex flex-wrap gap-2">
              {WALLET_ICONS.map((ic) => (
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
              id="wallet-submit-btn"
            >
              {submitting ? "Menyimpan..." : wallet ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
