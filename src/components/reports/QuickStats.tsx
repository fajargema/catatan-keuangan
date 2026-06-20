"use client";

import { useMemo } from "react";
import {
  Hash,
  CalendarDays,
  Receipt,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import { formatRupiah, formatDateShort } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";

interface QuickStatsProps {
  transactions: TransactionWithRelations[];
  /** Jumlah hari yang sudah berjalan dalam periode terpilih (untuk rata-rata/hari). */
  periodDays: number;
  loading?: boolean;
}

export default function QuickStats({
  transactions,
  periodDays,
  loading,
}: QuickStatsProps) {
  const stats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

    // Transaksi pengeluaran terbesar
    const biggest = expenses.reduce<TransactionWithRelations | null>(
      (max, t) => (!max || t.amount > max.amount ? t : max),
      null
    );

    // Hari dengan total pengeluaran tertinggi
    const perDay: Record<string, number> = {};
    expenses.forEach((t) => {
      perDay[t.date] = (perDay[t.date] || 0) + t.amount;
    });
    let topDay: { date: string; total: number } | null = null;
    for (const [date, total] of Object.entries(perDay)) {
      if (!topDay || total > topDay.total) topDay = { date, total };
    }

    const days = Math.max(periodDays, 1);

    return {
      txCount: transactions.length,
      avgPerDay: totalExpense / days,
      avgPerTx: expenses.length > 0 ? totalExpense / expenses.length : 0,
      biggest,
      topDay,
    };
  }, [transactions, periodDays]);

  const items = [
    {
      icon: Hash,
      label: "Jumlah Transaksi",
      value: `${stats.txCount}`,
      sub: "transaksi tercatat",
      color: "var(--accent-indigo)",
    },
    {
      icon: CalendarDays,
      label: "Rata-rata / Hari",
      value: formatRupiah(stats.avgPerDay),
      sub: "pengeluaran harian",
      color: "var(--accent-blue)",
    },
    {
      icon: Receipt,
      label: "Rata-rata / Transaksi",
      value: formatRupiah(stats.avgPerTx),
      sub: "per pengeluaran",
      color: "var(--accent-cyan)",
    },
    {
      icon: ArrowUpRight,
      label: "Transaksi Terbesar",
      value: stats.biggest ? formatRupiah(stats.biggest.amount) : "—",
      sub: stats.biggest
        ? stats.biggest.category?.name ??
          stats.biggest.description ??
          "Pengeluaran"
        : "belum ada",
      color: "var(--color-expense)",
    },
    {
      icon: Flame,
      label: "Hari Paling Boros",
      value: stats.topDay ? formatDateShort(stats.topDay.date) : "—",
      sub: stats.topDay ? formatRupiah(stats.topDay.total) : "belum ada",
      color: "#f97316",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="skeleton w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-5 w-24 rounded" />
            <div className="skeleton h-2.5 w-16 rounded mt-1.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in">
      {items.map(({ icon: Icon, label, value, sub, color }) => (
        <div
          key={label}
          className="glass-card p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-semibold">
              {label}
            </p>
          </div>
          <p
            className="text-base sm:text-xl font-bold tabular-nums truncate"
            style={{ color }}
          >
            {value}
          </p>
          <p className="text-[10px] text-muted mt-0.5 truncate">{sub}</p>
        </div>
      ))}
    </div>
  );
}
