"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  subMonths,
  subDays,
  startOfMonth,
  differenceInCalendarDays,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/utils";
import { Download } from "lucide-react";
import IncomeExpenseChart from "@/components/reports/IncomeExpenseChart";
import CategoryPieChart from "@/components/reports/CategoryPieChart";
import MonthlyTrendChart from "@/components/reports/MonthlyTrendChart";
import FinancialInsights from "@/components/reports/FinancialInsights";
import QuickStats from "@/components/reports/QuickStats";
import TopTransactions from "@/components/reports/TopTransactions";
import PeriodComparison from "@/components/reports/PeriodComparison";
import DayAnalysis from "@/components/reports/DayAnalysis";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { exportReportPdf } from "@/lib/exportReportPdf";
import type {
  MonthlyReport,
  CategoryReport,
  CategorySourceSlice,
  TransactionWithRelations,
  Source,
} from "@/lib/types";

/** Agregasi total per kategori untuk satu jenis transaksi, lengkap dengan persentase. */
const NO_SOURCE_ID = "__none__";

/** Agregasi total per kategori untuk satu jenis transaksi, lengkap dengan
 * persentase dan rincian per sumber dana di tiap kategori. */
function groupByCategory(
  transactions: TransactionWithRelations[],
  type: "income" | "expense"
): CategoryReport[] {
  const map: Record<
    string,
    {
      name: string;
      icon: string;
      color: string;
      total: number;
      sources: Record<string, CategorySourceSlice>;
    }
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
          sources: {},
        };
      }
      map[cat.id].total += t.amount;

      // Rincian per sumber dana
      const sid = t.source?.id ?? NO_SOURCE_ID;
      if (!map[cat.id].sources[sid]) {
        map[cat.id].sources[sid] = t.source
          ? {
              name: t.source.name,
              icon: t.source.icon,
              color: t.source.color,
              total: 0,
            }
          : { name: "Tanpa Sumber", icon: "❓", color: "#94a3b8", total: 0 };
      }
      map[cat.id].sources[sid].total += t.amount;
    });

  const items = Object.values(map).sort((a, b) => b.total - a.total);
  const total = items.reduce((s, i) => s + i.total, 0);
  return items.map((item) => ({
    name: item.name,
    icon: item.icon,
    color: item.color,
    total: item.total,
    percentage: total > 0 ? (item.total / total) * 100 : 0,
    sources: Object.values(item.sources).sort((a, b) => b.total - a.total),
  }));
}

type Period = 3 | 6 | 12 | "current" | "today";

const PERIOD_LABEL: Record<string, string> = {
  today: "Hari Ini",
  current: "Bulan Ini",
  "3": "3 Bulan Terakhir",
  "6": "6 Bulan Terakhir",
  "12": "12 Bulan Terakhir",
};

/** Batas periode terpilih + periode sebelumnya (untuk perbandingan).
 * Mengembalikan tanggal "yyyy-MM-dd": data periode aktif = [curStart, now],
 * periode sebelumnya = [prevStart, curStart). */
function getPeriodBounds(period: Period): { curStart: string; prevStart: string } {
  const now = new Date();
  let curStart: Date;
  let prevStart: Date;

  if (period === "today") {
    curStart = now;
    prevStart = subDays(now, 1);
  } else if (period === "current") {
    curStart = startOfMonth(now);
    prevStart = startOfMonth(subMonths(now, 1));
  } else {
    curStart = subMonths(now, period);
    prevStart = subMonths(now, period * 2);
  }

  return {
    curStart: format(curStart, "yyyy-MM-dd"),
    prevStart: format(prevStart, "yyyy-MM-dd"),
  };
}

export default function ReportsPage() {
  const { userId, user } = useAuth();
  // Menyimpan transaksi sejak awal periode SEBELUMNYA agar bisa dibandingkan.
  const [allTransactions, setAllTransactions] = useState<
    TransactionWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<Period>("current");
  // Naikkan nilai ini untuk memicu ulang fetch (tombol "Coba lagi")
  const [reloadKey, setReloadKey] = useState(0);

  const bounds = useMemo(() => getPeriodBounds(months), [months]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

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
        .gte("date", bounds.prevStart)
        .order("date", { ascending: true });

      if (!error && data) {
        setAllTransactions(data as unknown as TransactionWithRelations[]);
        setError(null);
      } else if (error) {
        setError(error.message || "Gagal memuat data laporan");
      }
      setLoading(false);
    };

    fetchData();
  }, [bounds.prevStart, userId, reloadKey]);

  // Pisahkan data periode aktif vs periode sebelumnya berdasarkan tanggal.
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.date >= bounds.curStart),
    [allTransactions, bounds.curStart]
  );
  const prevTransactions = useMemo(
    () =>
      allTransactions.filter(
        (t) => t.date >= bounds.prevStart && t.date < bounds.curStart
      ),
    [allTransactions, bounds.prevStart, bounds.curStart]
  );

  // Mode "Hari Ini"/"Bulan Ini" hanya punya sedikit titik data bulanan — chart
  // jadi tampak kosong. Gunakan granularitas harian agar tetap informatif.
  const granularity: "day" | "month" =
    months === "current" || months === "today" ? "day" : "month";

  // Jumlah hari berjalan dalam periode — basis rata-rata pengeluaran/hari.
  const periodDays = useMemo(() => {
    const now = new Date();
    if (months === "today") return 1;
    if (months === "current") return now.getDate();
    return differenceInCalendarDays(now, subMonths(now, months)) + 1;
  }, [months]);

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

  // Label periode pembanding untuk kartu "Perbandingan Periode".
  const comparedTo =
    months === "today"
      ? "vs kemarin"
      : months === "current"
      ? "vs bulan lalu"
      : `vs ${months} bulan sebelumnya`;

  const handleExport = () => {
    const meta = user?.user_metadata as { full_name?: string } | undefined;
    exportReportPdf({
      periodLabel: PERIOD_LABEL[String(months)],
      comparedTo,
      periodDays,
      transactions,
      prevTransactions,
      expenseCategories: expenseCategoryData,
      incomeCategories: incomeCategoryData,
      sourceBreakdown,
      userName: meta?.full_name ?? user?.email ?? undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="animate-slide-in-right">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Report</h1>
            <p className="text-xs sm:text-sm text-muted">Analisis keuangan Anda</p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || transactions.length === 0}
            className="export-pdf-btn shrink-0"
            id="export-pdf-btn"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
        {/* Period tabs — scrollable on mobile */}
        <div
          className="no-print flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            key="today"
            onClick={() => setMonths("today")}
            aria-pressed={months === "today"}
            className={`tab-btn shrink-0 ${months === "today" ? "active" : ""}`}
          >
            Hari Ini
          </button>
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

      {/* Ringkasan + perbandingan periode (digabung jadi satu) */}
      <PeriodComparison
        transactions={transactions}
        prevTransactions={prevTransactions}
        comparedTo={comparedTo}
        loading={loading}
      />

      <FinancialInsights transactions={transactions} loading={loading} />

      {/* Statistik ringkas */}
      <QuickStats
        transactions={transactions}
        periodDays={periodDays}
        loading={loading}
      />

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
          <TopTransactions transactions={transactions} />

          <IncomeExpenseChart data={trendData} granularity={granularity} />

          {/* Tren butuh minimal 2 titik data agar bermakna */}
          {trendData.length >= 2 && (
            <MonthlyTrendChart data={trendData} granularity={granularity} />
          )}

          {/* Pola pengeluaran per hari dalam seminggu */}
          <DayAnalysis transactions={transactions} />

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
