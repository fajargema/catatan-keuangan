"use client";

import { useState, useMemo } from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { getToday, formatRupiahInput } from "@/lib/utils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { Category, Wallet, Source, TransactionFormData, TransactionWithRelations } from "@/lib/types";
import CustomSelect from "@/components/ui/CustomSelect";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

import { motion } from "framer-motion";

interface TransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  sources: Source[];
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onClose: () => void;
  /** If provided, the form runs in edit mode pre-filled with this transaction */
  transaction?: TransactionWithRelations;
}

export default function TransactionForm({
  wallets,
  categories,
  sources,
  onSubmit,
  onClose,
  transaction,
}: TransactionFormProps) {
  const isEditMode = Boolean(transaction);

  useEscapeKey(onClose);

  const [type, setType] = useState<"income" | "expense">(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(
    transaction ? formatRupiahInput(String(transaction.amount)) : ""
  );
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [walletId, setWalletId] = useState(transaction?.wallet_id ?? wallets[0]?.id ?? "");
  const [sourceId, setSourceId] = useState(transaction?.source_id ?? sources[0]?.id ?? "");
  const [date, setDate] = useState(transaction?.date ?? getToday());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id,
        label: w.name,
        icon: w.icon,
      })),
    [wallets]
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Number(amount.replace(/\D/g, ""));
    if (!amount || numericAmount <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    if (!walletId) {
      setError("Pilih dompet terlebih dahulu");
      return;
    }
    if (!categoryId) {
      setError("Pilih kategori terlebih dahulu");
      return;
    }
    // source_id bersifat opsional (nullable di database)

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        type,
        amount: numericAmount,
        description: description.trim(),
        category_id: categoryId,
        wallet_id: walletId,
        source_id: sourceId || null,
        date,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (err as any)?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay" 
      onClick={onClose}
      style={{ animation: 'none' }} // Override CSS animation
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "Edit Transaksi" : "Tambah Transaksi"}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'none' }} // Override CSS animation
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">
              {isEditMode ? "Edit Transaksi" : "Tambah Transaksi"}
            </h2>
            {isEditMode && (
              <p className="text-xs text-muted mt-0.5">Ubah detail transaksi ini</p>
            )}
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
          {/* Type Selector (Fintech Cards) */}
          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Tipe Transaksi
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Expense Card */}
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategoryId("");
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  type === "expense"
                    ? "bg-expense/8 border-expense/45 shadow-[0_4px_20px_rgba(244,63,94,0.12)]"
                    : "glass-card border-card-border hover:border-muted"
                }`}
                style={{
                  cursor: "pointer",
                }}
              >
                <div
                  className="icon-badge icon-badge-sm shrink-0"
                  style={{
                    background: type === "expense" ? "rgba(244,63,94,0.18)" : "var(--glass-bg-hover)",
                  }}
                >
                  <TrendingDown size={16} style={{ color: "var(--color-expense)" }} />
                </div>
                <div>
                  <p
                    className="font-bold text-sm transition-colors"
                    style={{
                      color: type === "expense" ? "var(--color-expense)" : "var(--text-primary)",
                    }}
                  >
                    Pengeluaran
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">Uang keluar, belanja, tagihan</p>
                </div>
              </button>

              {/* Income Card */}
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategoryId("");
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  type === "income"
                    ? "bg-income/8 border-income/45 shadow-[0_4px_20px_rgba(16,185,129,0.12)]"
                    : "glass-card border-card-border hover:border-muted"
                }`}
                style={{
                  cursor: "pointer",
                }}
              >
                <div
                  className="icon-badge icon-badge-sm shrink-0"
                  style={{
                    background: type === "income" ? "rgba(16,185,129,0.18)" : "var(--glass-bg-hover)",
                  }}
                >
                  <TrendingUp size={16} style={{ color: "var(--color-income)" }} />
                </div>
                <div>
                  <p
                    className="font-bold text-sm transition-colors"
                    style={{
                      color: type === "income" ? "var(--color-income)" : "var(--text-primary)",
                    }}
                  >
                    Pemasukan
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">Uang masuk, gaji, freelance</p>
                </div>
              </button>
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
              id="transaction-amount-input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Kategori
            </label>
            <div 
              className="flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-2 sm:pb-0 snap-x sm:snap-none"
              style={{ scrollbarWidth: "none" }}
            >
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all shrink-0 sm:shrink snap-start sm:snap-align-none ${
                    categoryId === cat.id
                      ? "border-2 font-medium"
                      : "border border-card-border hover:border-muted"
                  }`}
                  style={
                    categoryId === cat.id
                      ? {
                          backgroundColor: cat.color + "15",
                          borderColor: cat.color + "50",
                          color: cat.color,
                        }
                      : {}
                  }
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Dompet
            </label>
            <CustomSelect
              value={walletId}
              onChange={setWalletId}
              options={walletOptions}
              placeholder="Pilih dompet..."
              id="transaction-wallet-select"
              showDefaultOption={false}
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Sumber <span className="text-xs font-normal">(opsional)</span>
            </label>
            <div 
              className="flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-2 sm:pb-0 snap-x sm:snap-none"
              style={{ scrollbarWidth: "none" }}
            >
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceId(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all shrink-0 sm:shrink snap-start sm:snap-align-none ${
                    sourceId === s.id
                      ? "border-2 font-medium"
                      : "border border-card-border hover:border-muted"
                  }`}
                  style={
                    sourceId === s.id
                      ? {
                          backgroundColor: s.color + "15",
                          borderColor: s.color + "50",
                          color: s.color,
                        }
                      : {}
                  }
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Deskripsi (opsional)
            </label>
            <input
              type="text"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              placeholder="Catatan singkat..."
              id="transaction-description-input"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Tanggal
            </label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              id="transaction-date-picker"
            />
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
              id="transaction-submit-btn"
            >
              {submitting ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
