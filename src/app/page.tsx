"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Globe } from "lucide-react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import WalletSummary from "@/components/dashboard/WalletSummary";
import SourceBreakdown from "@/components/dashboard/SourceBreakdown";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import TransactionForm from "@/components/transactions/TransactionForm";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useWallets } from "@/hooks/useWallets";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSources } from "@/hooks/useSources";
import { useToast } from "@/context/ToastContext";
import { getMonthRange, getCurrentYearMonth } from "@/lib/utils";
import type { TransactionFormData } from "@/lib/types";

export default function DashboardPage() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string>("");
  const { showToast } = useToast();

  const { startDate, endDate } = getMonthRange(getCurrentYearMonth());
  const currentMonthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
    new Date()
  );

  const {
    wallets,
    totalBalance,
    loading: walletsLoading,
    error: walletsError,
    refetch: refetchWallets,
  } = useWallets();
  const { categories } = useCategories();
  const { sources } = useSources();
  const { totalCurrent: investmentValue, loading: investmentsLoading } = useInvestments();

  const activeSource = sources.find((s) => s.id === activeSourceId);

  // Single query for monthly transactions — derive recent from the same data
  const {
    transactions: monthlyTransactions,
    totalIncome: monthlyIncome,
    totalExpense: monthlyExpense,
    loading: monthlyLoading,
    error: monthlyError,
    addTransaction,
    refetch: refetchMonthlyTotals,
  } = useTransactions({
    startDate,
    endDate,
    sourceId: activeSourceId || undefined,
  });

  // Derive recent dari data bulanan yang sama — no extra query!
  // 8 item agar kolom samping desktop terisi seimbang
  const recentTransactions = useMemo(
    () => monthlyTransactions.slice(0, 8),
    [monthlyTransactions]
  );

  const handleAddTransaction = async (data: TransactionFormData) => {
    try {
      await addTransaction(data);
      await refetchWallets();
      showToast("Transaksi berhasil ditambahkan!", "success");
    } catch {
      showToast("Gagal menambahkan transaksi. Coba lagi.", "error");
      throw new Error("Gagal menambahkan transaksi");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between animate-slide-in-right">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted">Ringkasan keuangan Anda</p>
        </div>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="btn-primary"
          id="add-transaction-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Transaksi</span>
        </button>
      </div>

      {/* Error dari fetch data — tampilkan dengan tombol retry */}
      {(walletsError || monthlyError) && (
        <ErrorBanner
          message={walletsError || monthlyError || ""}
          onRetry={() => {
            refetchWallets();
            refetchMonthlyTotals();
          }}
        />
      )}

      {/* Kekayaan bersih — saldo dompet + nilai investasi (total keseluruhan) */}
      <NetWorthCard
        walletBalance={totalBalance}
        investmentValue={investmentValue}
        loading={walletsLoading || investmentsLoading}
      />

      {/* Source Filter Tabs — scrollable on mobile */}
      {!walletsLoading && sources.length > 0 && (
        <div
          className="flex gap-2 animate-fade-in delay-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            onClick={() => setActiveSourceId("")}
            aria-pressed={activeSourceId === ""}
            className={`focus-ring relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 border ${
              activeSourceId === ""
                ? "border-transparent bg-transparent"
                : "text-muted border-card-border bg-card"
            }`}
            style={activeSourceId === "" ? { color: "var(--on-accent)" } : undefined}
          >
            {activeSourceId === "" && (
              <motion.div
                layoutId="active-source-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: "var(--accent-indigo)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Globe size={13} className="relative z-10" />
            <span className="relative z-10">Semua Sumber</span>
          </button>
          
          {sources.map((s) => {
            const isActive = activeSourceId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSourceId(s.id)}
                aria-pressed={isActive}
                className={`focus-ring relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 border ${
                  isActive
                    ? "border-transparent bg-transparent"
                    : "text-muted border-card-border bg-card"
                }`}
                style={isActive ? { color: s.color } : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-source-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: s.color + "22", border: `1px solid ${s.color}60` }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{s.icon}</span>
                <span className="relative z-10">{s.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Layar lebar: 2 kolom — konten utama + transaksi terbaru di samping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <BalanceCard
            totalBalance={totalBalance}
            totalIncome={monthlyIncome}
            totalExpense={monthlyExpense}
            loading={walletsLoading || monthlyLoading}
            activeSourceName={activeSource?.name}
          />

          <WalletSummary wallets={wallets} loading={walletsLoading} />

          <SourceBreakdown
            transactions={monthlyTransactions}
            loading={monthlyLoading}
            monthName={currentMonthName}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-8">
          <RecentTransactions
            transactions={recentTransactions}
            loading={monthlyLoading}
          />
        </div>
      </div>

      <AnimatePresence>
        {showTransactionForm && (
          <TransactionForm
            wallets={wallets}
            categories={categories}
            sources={sources}
            onSubmit={handleAddTransaction}
            onClose={() => setShowTransactionForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
