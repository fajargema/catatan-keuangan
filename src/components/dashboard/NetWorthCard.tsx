"use client";

import { Gem, Wallet, TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";

interface NetWorthCardProps {
  /** Total saldo seluruh dompet. */
  walletBalance: number;
  /** Total nilai seluruh aset investasi saat ini. */
  investmentValue: number;
  loading?: boolean;
}

/**
 * Kekayaan bersih = saldo dompet + nilai investasi. Strip ringkas di atas
 * Dashboard, memakai state visibilitas yang sama dengan kartu saldo.
 */
export default function NetWorthCard({
  walletBalance,
  investmentValue,
  loading,
}: NetWorthCardProps) {
  const { hidden } = useBalanceVisibility();
  const total = walletBalance + investmentValue;
  const walletPct = total > 0 ? (walletBalance / total) * 100 : 0;
  const investPct = total > 0 ? (investmentValue / total) * 100 : 0;

  const money = (v: number) => (hidden ? "Rp ••••••" : formatRupiah(v));

  if (loading) {
    return (
      <div
        className="relative overflow-hidden rounded-[20px] p-5 sm:p-6 animate-fade-in"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(6,182,212,0.10) 50%, rgba(16,185,129,0.12) 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="skeleton h-3 w-40 mb-3 rounded-full" />
        <div className="skeleton h-9 w-60 max-w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-5 sm:p-6 animate-fade-in"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(6,182,212,0.10) 50%, rgba(16,185,129,0.12) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 w-44 h-44 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)" }} />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Total */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="icon-badge icon-badge-sm" style={{ background: "rgba(99,102,241,0.18)" }}>
              <Gem size={15} style={{ color: "var(--accent-indigo)" }} />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Total Kekayaan Bersih
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
            {money(total)}
          </p>
        </div>

        {/* Breakdown: Dompet + Investasi */}
        <div className="flex gap-2.5 shrink-0">
          <div className="rounded-xl px-3.5 py-2.5 bg-foreground/3 border border-card-border backdrop-blur-sm min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wide font-medium mb-0.5">
              <Wallet size={11} /> Dompet
              <span className="text-tertiary">· {walletPct.toFixed(0)}%</span>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">{money(walletBalance)}</p>
          </div>
          <div className="rounded-xl px-3.5 py-2.5 bg-foreground/3 border border-card-border backdrop-blur-sm min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wide font-medium mb-0.5">
              <TrendingUp size={11} style={{ color: "var(--accent-indigo)" }} /> Investasi
              <span className="text-tertiary">· {investPct.toFixed(0)}%</span>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">{money(investmentValue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
