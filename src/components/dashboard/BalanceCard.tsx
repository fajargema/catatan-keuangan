"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(value, { bounce: 0, duration: 800 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const displayValue = useTransform(spring, (current) => formatRupiah(Math.round(current)));
  
  return <motion.span>{displayValue}</motion.span>;
}

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  loading?: boolean;
  monthName?: string;
  activeSourceName?: string;
}

export default function BalanceCard({
  totalBalance,
  totalIncome,
  totalExpense,
  loading,
  monthName,
  activeSourceName,
}: BalanceCardProps) {
  const displayMonth = monthName || "Bulan Ini";
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  if (loading) {
    return (
      <div className="balance-card animate-fade-in">
        <div className="skeleton h-3 w-1/3 max-w-30 mb-3 rounded-full" />
        <div className="skeleton h-10 w-3/4 max-w-60 mb-6 rounded-xl" />
        <div className="flex gap-3 sm:gap-5">
          <div className="skeleton h-16 w-1/2 max-w-45 rounded-2xl" />
          <div className="skeleton h-16 w-1/2 max-w-45 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card animate-fade-in" style={{ position: "relative", zIndex: 1 }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2" style={{ position: "relative", zIndex: 2 }}>
        <div className="flex items-center gap-2">
          <div
            className="icon-badge icon-badge-sm"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <Wallet size={16} style={{ color: "var(--accent-emerald)" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Total Saldo — Semua Dompet
          </span>
        </div>
        {savingsRate > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(16,185,129,0.12)",
              color: "var(--accent-emerald)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <ArrowUpRight size={11} />
            {savingsRate.toFixed(0)}% ditabung
          </div>
        )}
      </div>

      {/* Balance number */}
      <motion.h2
        className="gradient-text tabular-nums"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          marginBottom: "24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <AnimatedCounter value={totalBalance} />
      </motion.h2>

      {/* Stats row */}
      <div
        className="flex flex-wrap gap-3"
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* Income */}
        <div
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--color-income) 12%, var(--bg-surface))",
            border: "1px solid color-mix(in srgb, var(--color-income) 30%, transparent)",
            backdropFilter: "blur(8px)",
            flex: "1 1 140px",
          }}
        >
          <div
            className="icon-badge icon-badge-sm shrink-0"
            style={{ background: "rgba(16,185,129,0.18)" }}
          >
            <TrendingUp size={14} style={{ color: "var(--color-income)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs mb-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
              Pemasukan{activeSourceName ? ` · ${activeSourceName}` : ""}
            </p>
            <p className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "var(--color-income)" }}>
              {formatRupiah(totalIncome)}
            </p>
          </div>
        </div>

        {/* Expense */}
        <div
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--color-expense) 12%, var(--bg-surface))",
            border: "1px solid color-mix(in srgb, var(--color-expense) 30%, transparent)",
            backdropFilter: "blur(8px)",
            flex: "1 1 140px",
          }}
        >
          <div
            className="icon-badge icon-badge-sm shrink-0"
            style={{ background: "rgba(244,63,94,0.18)" }}
          >
            <TrendingDown size={14} style={{ color: "var(--color-expense)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs mb-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
              Pengeluaran{activeSourceName ? ` · ${activeSourceName}` : ""}
            </p>
            <p className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "var(--color-expense)" }}>
              {formatRupiah(totalExpense)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
