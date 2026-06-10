"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import IncomeExpenseChart from "@/components/reports/IncomeExpenseChart";
import CategoryPieChart from "@/components/reports/CategoryPieChart";
import MonthlyTrendChart from "@/components/reports/MonthlyTrendChart";
import FinancialInsights from "@/components/reports/FinancialInsights";
import ErrorBanner from "@/components/ui/ErrorBanner";
import type {
  MonthlyReport,
  CategoryReport,
  TransactionWithRelations,
  Source,
} from "@/lib/types";

/** Agregasi total per kategori untuk satu jenis transaksi, lengkap dengan persentase. */
function groupByCategory(
  transactions: TransactionWithRelations[],
  type: "income" | "expense"
): CategoryReport[] {
  const map: Record<
    string,
    { name: string; icon: string; color: string; total: number }
  > = {};

  transactions
    .filter((t) => t.type === type && t.category)
    .forEach((t) => {
      const cat = t.category!;
      if (!map[cat.id]) {
        map[cat.id] = {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          total: 0,
        };
      }
      map[cat.id].total += t.amount;
    });

  const items = Object.values(map).sort((a, b) => b.total - a.total);
  const total = items.reduce((s, i) => s + i.total, 0);
  return items.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.total / total) * 100 : 0,
  }));
}

export default function ReportsPage() {
  const { userId } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<3 | 6 | 12 | "current">("current");
  // Naikkan nilai ini untuk memicu ulang fetch (tombol "Coba lagi")
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let startDate: string;
      if (months === "current") {
        const now = new Date();
        startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
      } else {
        startDate = format(subMonths(new Date(), months), "yyyy-MM-dd");
      }

      // Selective columns — only what reports actually use
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id, type, amount, description, date, created_at, updated_at,
          category_id, wallet_id, source_id, user_id, is_transfer,
          category:categories(id, name, icon, color, type, created_at),
          wallet:wallets(id, name, icon, color, balance, created_at, updated_at),
          source:sources(id, name, icon, color, created_at)
        `
        )
        .eq("user_id", userId)
        .eq("is_transfer", false)
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (!error && data) {
        setTransactions(data as unknown as TransactionWithRelations[]);
        setError(null);
      } else if (error) {
        setError(error.message || "Gagal memuat data laporan");
      }
      setLoading(false);
    };

    fetchData();
  }, [months, userId, reloadKey]);

  // Mode "Bulan Ini" hanya punya 1 titik data bulanan — chart jadi tampak
  // kosong. Gunakan granularitas harian agar tetap informatif.
  const granularity: "day" | "month" = months === "current" ? "day" : "month";

  const trendData: MonthlyReport[] = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((t) => {
      const key = granularity === "day" ? t.date : t.date.substring(0, 7);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === "income") {
        map[key].income += t.amount;
      } else {
        map[key].expense += t.amount;
      }
    });

    return Object.entries(map)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions, granularity]);

  // Category reports
  const expenseCategoryData = useMemo(
    () => groupByCategory(transactions, "expense"),
    [transactions]
  );
  const incomeCategoryData = useMemo(
    () => groupByCategory(transactions, "income"),
    [transactions]
  );

  // Per-source breakdown
  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { source: Source; income: number; expense: number }> = {};

    transactions.forEach((t) => {
      if (!t.source) return;
      if (!map[t.source.id]) {
        map[t.source.id] = { source: t.source, income: 0, expense: 0 };
      }
      if (t.type === "income") {
        map[t.source.id].income += t.amount;
      } else {
        map[t.source.id].expense += t.amount;
      }
    });

    return Object.values(map).sort((a, b) =>
      (b.income + b.expense) - (a.income + a.expense)
    );
  }, [transactions]);

  // ✅ Memoized totals — avoid recomputing on every render
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const netSavings = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="animate-slide-in-right">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Report</h1>
            <p className="text-xs sm:text-sm text-muted">Analisis keuangan Anda</p>
          </div>
        </div>
        {/* Period tabs — scrollable on mobile */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            key="current"
            onClick={() => setMonths("current")}
            aria-pressed={months === "current"}
            className={`tab-btn shrink-0 ${months === "current" ? "active" : ""}`}
          >
            Bulan Ini
          </button>
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              aria-pressed={months === m}
              className={`tab-btn shrink-0 ${months === m ? "active" : ""}`}
            >
              {m} Bulan
            </button>
          ))}
        </div>
      </div>

      {/* Error dari fetch data */}
      {error && (
        <ErrorBanner message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {/* Summary Cards — 2 col on mobile, 3 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-income/10 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-income" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted">Total Pemasukan</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-income tabular-nums">
            {loading ? "..." : formatRupiah(totalIncome)}
          </p>
        </div>
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-expense/10 flex items-center justify-center shrink-0">
              <TrendingDown size={16} className="text-expense" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted">Total Pengeluaran</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-expense tabular-nums">
            {loading ? "..." : formatRupiah(totalExpense)}
          </p>
        </div>
        <div className="glass-card p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
              <PiggyBank size={16} className="text-accent-blue" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted">Tabungan Bersih</p>
          </div>
          <p
            className={`text-base sm:text-xl font-bold tabular-nums ${
              netSavings >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {loading ? "..." : formatRupiah(netSavings)}
          </p>
        </div>
      </div>

      <FinancialInsights transactions={transactions} loading={loading} />

      {/* Charts */}
      {loading ? (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="skeleton h-4 w-48 mb-4" />
            <div className="skeleton h-72 w-full" />
          </div>
          <div className="glass-card p-6">
            <div className="skeleton h-4 w-48 mb-4" />
            <div className="skeleton h-72 w-full" />
          </div>
        </div>
      ) : (
        <>
          <IncomeExpenseChart data={trendData} granularity={granularity} />

          {/* Tren butuh minimal 2 titik data agar bermakna */}
          {trendData.length >= 2 && (
            <MonthlyTrendChart data={trendData} granularity={granularity} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart
              data={expenseCategoryData}
              title="Distribusi Pengeluaran"
            />
            <CategoryPieChart
              data={incomeCategoryData}
              title="Distribusi Pemasukan"
            />
          </div>

          {/* Source Breakdown */}
          {sourceBreakdown.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-base font-bold mb-4">Breakdown per Sumber</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceBreakdown.map(({ source, income, expense }) => {
                  const net = income - expense;
                  return (
                    <div
                      key={source.id}
                      className="p-4 rounded-xl border border-card-border bg-card-hover/30"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: source.color + "20" }}
                        >
                          {source.icon}
                        </span>
                        <p className="font-semibold text-sm" style={{ color: source.color }}>
                          {source.name}
                        </p>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">Pemasukan</span>
                          <span className="text-income font-medium">{formatRupiah(income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Pengeluaran</span>
                          <span className="text-expense font-medium">{formatRupiah(expense)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t border-card-border">
                          <span className="text-muted font-medium">Net</span>
                          <span
                            className={`font-bold ${
                              net >= 0 ? "text-income" : "text-expense"
                            }`}
                          >
                            {net >= 0 ? "+" : ""}{formatRupiah(net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
