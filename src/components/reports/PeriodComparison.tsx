"use client";

import { useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";

interface PeriodComparisonProps {
  transactions: TransactionWithRelations[];
  prevTransactions: TransactionWithRelations[];
  /** Label deskriptif periode pembanding, mis. "vs bulan lalu". */
  comparedTo: string;
  loading?: boolean;
}

function sumByType(txs: TransactionWithRelations[]) {
  let income = 0;
  let expense = 0;
  txs.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });
  return { income, expense, savings: income - expense };
}

/** Delta dalam persen; null bila tidak ada basis pembanding. */
function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

function DeltaBadge({
  delta,
  goodWhenUp,
}: {
  delta: number | null;
  goodWhenUp: boolean;
}) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted shrink-0">
        <Minus size={12} /> data baru
      </span>
    );
  }

  const up = delta > 0;
  const flat = Math.abs(delta) < 0.05;
  const isGood = up === goodWhenUp;
  const color = flat
    ? "#94a3b8"
    : isGood
    ? "var(--color-income)"
    : "var(--color-expense)";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <Icon size={12} />
      {flat ? "0%" : `${up ? "+" : ""}${delta.toFixed(0)}%`}
    </span>
  );
}

export default function PeriodComparison({
  transactions,
  prevTransactions,
  comparedTo,
  loading,
}: PeriodComparisonProps) {
  const { cur, prev } = useMemo(
    () => ({
      cur: sumByType(transactions),
      prev: sumByType(prevTransactions),
    }),
    [transactions, prevTransactions]
  );

  const cards = [
    {
      label: "Total Pemasukan",
      icon: TrendingUp,
      iconBg: "bg-income/10",
      iconClass: "text-income",
      valueClass: "text-income",
      value: cur.income,
      prev: prev.income,
      delta: pctChange(cur.income, prev.income),
      goodWhenUp: true,
    },
    {
      label: "Total Pengeluaran",
      icon: TrendingDown,
      iconBg: "bg-expense/10",
      iconClass: "text-expense",
      valueClass: "text-expense",
      value: cur.expense,
      prev: prev.expense,
      delta: pctChange(cur.expense, prev.expense),
      goodWhenUp: false,
    },
    {
      label: "Tabungan Bersih",
      icon: PiggyBank,
      iconBg: "bg-accent-blue/10",
      iconClass: "text-accent-blue",
      valueClass: cur.savings >= 0 ? "text-income" : "text-expense",
      value: cur.savings,
      prev: prev.savings,
      delta: pctChange(cur.savings, prev.savings),
      goodWhenUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="skeleton w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-6 w-32 rounded" />
            <div className="skeleton h-3 w-28 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="glass-card p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon size={16} className={c.iconClass} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-semibold">
                {c.label}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-base sm:text-xl font-bold tabular-nums truncate ${c.valueClass}`}
              >
                {formatRupiah(c.value)}
              </p>
              <DeltaBadge delta={c.delta} goodWhenUp={c.goodWhenUp} />
            </div>

            <p className="text-[10px] text-muted mt-1.5 truncate">
              Sebelumnya: {formatRupiah(c.prev)} · {comparedTo}
            </p>
          </div>
        );
      })}
    </div>
  );
}
