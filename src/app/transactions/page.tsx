"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, SlidersHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { useWallets } from "@/hooks/useWallets";
import { useCategories } from "@/hooks/useCategories";
import { useSources } from "@/hooks/useSources";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionFilter from "@/components/transactions/TransactionFilter";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useToast } from "@/context/ToastContext";
import { formatRupiah, getMonthRange, getCurrentYearMonth } from "@/lib/utils";
import type { TransactionWithRelations, TransactionFormData } from "@/lib/types";

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const [filterType, setFilterType] = useState<"" | "income" | "expense">("");
  const { showToast } = useToast();
  const [filterWalletId, setFilterWalletId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterSourceId, setFilterSourceId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Set default filter ke bulan ini
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(selectedMonth),
    [selectedMonth]
  );

  const displayMonthName = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { sources } = useSources();

  // Saat mencari, lepas batasan bulan agar pencarian menjangkau semua transaksi
  const isSearching = searchQuery.trim().length > 0;

  const {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  } = useTransactions({
    walletId: filterWalletId || undefined,
    type: filterType || undefined,
    sourceId: filterSourceId || undefined,
    startDate: isSearching ? undefined : startDate,
    endDate: isSearching ? undefined : endDate,
  });

  // Client-side category filter + search
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Category filter
    if (filterCategoryId) {
      result = result.filter((t) => t.category_id === filterCategoryId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const desc = (t.description || "").toLowerCase();
        const catName = (t.category?.name || "").toLowerCase();
        const walletName = (t.wallet?.name || "").toLowerCase();
        const sourceName = (t.source?.name || "").toLowerCase();
        const amount = String(t.amount);
        return desc.includes(q) || catName.includes(q) || walletName.includes(q) || sourceName.includes(q) || amount.includes(q);
      });
    }

    return result;
  }, [transactions, filterCategoryId, searchQuery]);

  // Kartu ringkasan dihitung dari data yang SUDAH difilter (tipe, sumber,
  // dompet, kategori, pencarian) lalu dibatasi ke bulan terpilih — agar
  // selalu konsisten dengan daftar di bawahnya. Transfer antar dompet
  // tidak dihitung sebagai pemasukan/pengeluaran.
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const inMonth = filteredTransactions.filter(
      (t) => t.date.slice(0, 7) === selectedMonth
    );
    return {
      monthlyIncome: inMonth
        .filter((t) => t.type === "income" && !t.is_transfer)
        .reduce((sum, t) => sum + t.amount, 0),
      monthlyExpense: inMonth
        .filter((t) => t.type === "expense" && !t.is_transfer)
        .reduce((sum, t) => sum + t.amount, 0),
    };
  }, [filteredTransactions, selectedMonth]);

  // Count active filters
  const activeFilterCount = [filterType, filterWalletId, filterCategoryId, filterSourceId].filter(Boolean).length;

  const handleTypeChange = (type: "" | "income" | "expense") => {
    setFilterType(type);
    setFilterCategoryId(""); // Reset kategori
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    try {
      await addTransaction(data);
      showToast("Transaksi berhasil ditambahkan!", "success");
    } catch {
      showToast("Gagal menambahkan transaksi.", "error");
      throw new Error("Gagal menambahkan transaksi");
    }
  };

  const handleEditTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      showToast("Transaksi berhasil diperbarui!", "success");
    } catch {
      showToast("Gagal memperbarui transaksi.", "error");
      throw new Error("Gagal memperbarui transaksi");
    }
  };

  const handleOpenEdit = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between animate-slide-in-right">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Transaksi</h1>
          <p className="text-xs sm:text-sm text-muted">
            Catat pemasukan dan pengeluaran Anda
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          id="add-transaction-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* ── Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        {/* Income */}
        <div className="glass-card p-4 flex items-start gap-3">
          <div
            className="icon-badge icon-badge-sm shrink-0"
            style={{ background: "var(--color-income-dim)" }}
          >
            <TrendingUp size={15} style={{ color: "var(--color-income)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted mb-1 font-medium uppercase tracking-wide">
              Pemasukan
            </p>
            <p className="text-sm sm:text-lg font-bold text-income leading-tight tabular-nums">
              {formatRupiah(monthlyIncome)}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate">{displayMonthName}</p>
          </div>
        </div>
        {/* Expense */}
        <div className="glass-card p-4 flex items-start gap-3">
          <div
            className="icon-badge icon-badge-sm shrink-0"
            style={{ background: "var(--color-expense-dim)" }}
          >
            <TrendingDown size={15} style={{ color: "var(--color-expense)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted mb-1 font-medium uppercase tracking-wide">
              Pengeluaran
            </p>
            <p className="text-sm sm:text-lg font-bold text-expense leading-tight tabular-nums">
              {formatRupiah(monthlyExpense)}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate">{displayMonthName}</p>
          </div>
        </div>
      </div>

      {/* ── Error dari fetch data ───────────────────── */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* ── Search + Filter Toggle ──────────────────── */}
      <div className="flex gap-2 animate-fade-in">
        {/* Search */}
        <div className="search-box flex items-center gap-2 px-3 py-2.5 rounded-2xl flex-1 bg-card border border-card-border">
          <Search size={15} className="text-tertiary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            aria-label="Cari transaksi"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-tertiary text-foreground min-w-0"
            id="search-transactions"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-md transition-colors text-muted hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter toggle button (mobile-friendly) */}
        <button
          onClick={() => setShowFilter((v) => !v)}
          className="focus-ring flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all shrink-0"
          style={{
            background: showFilter || activeFilterCount > 0
              ? "var(--accent-primary-dim)"
              : "var(--glass-bg)",
            border: `1px solid ${showFilter || activeFilterCount > 0 ? "color-mix(in srgb, var(--accent-primary) 32%, transparent)" : "var(--glass-border)"}`,
            color: showFilter || activeFilterCount > 0 ? "var(--accent-primary)" : "var(--text-secondary)",
          }}
          aria-label="Toggle filter"
          aria-expanded={showFilter}
          id="toggle-filter-btn"
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span
              className="flex items-center justify-center text-[10px] font-bold w-4 h-4 rounded-full"
              style={{ background: "var(--accent-primary)", color: "var(--on-accent)" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search result count */}
      {searchQuery.trim() && !loading && (
        <p className="text-xs px-1 font-medium -mt-2 text-tertiary">
          {filteredTransactions.length === 0
            ? `Tidak ada hasil untuk "${searchQuery}" di semua bulan`
            : `${filteredTransactions.length} transaksi ditemukan di semua bulan`}
        </p>
      )}

      {/* ── Filter Panel ───────────────────────────── */}
      {showFilter && (
        <TransactionFilter
          type={filterType}
          walletId={filterWalletId}
          categoryId={filterCategoryId}
          sourceId={filterSourceId}
          selectedMonth={selectedMonth}
          wallets={wallets}
          categories={categories}
          sources={sources}
          onTypeChange={handleTypeChange}
          onWalletChange={setFilterWalletId}
          onCategoryChange={setFilterCategoryId}
          onSourceChange={setFilterSourceId}
          onMonthChange={setSelectedMonth}
        />
      )}

      {/* ── Transaction List ────────────────────────── */}
      <TransactionList
        transactions={filteredTransactions}
        loading={loading}
        onDelete={deleteTransaction}
        onEdit={handleOpenEdit}
      />

      {/* ── Modals ─────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <TransactionForm
            wallets={wallets}
            categories={categories}
            sources={sources}
            onSubmit={handleAddTransaction}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTransaction && (
          <TransactionForm
            wallets={wallets}
            categories={categories}
            sources={sources}
            transaction={editingTransaction}
            onSubmit={handleEditTransaction}
            onClose={() => setEditingTransaction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
