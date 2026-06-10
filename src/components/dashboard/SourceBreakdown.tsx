"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Tags } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";

interface SourceBreakdownProps {
  transactions: TransactionWithRelations[];
  loading?: boolean;
  monthName?: string;
}

export default function SourceBreakdown({
  transactions,
  loading,
  monthName,
}: SourceBreakdownProps) {
  // Hitung per-source stats dari transaksi bulan ini
  const sourceStats = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        icon: string;
        color: string;
        income: number;
        expense: number;
      }
    > = {};

    transactions.forEach((t) => {
      if (!t.source) return;
      const sid = t.source.id;
      if (!map[sid]) {
        map[sid] = {
          id: sid,
          name: t.source.name,
          icon: t.source.icon,
          color: t.source.color,
          income: 0,
          expense: 0,
        };
      }
      if (t.type === "income") map[sid].income += t.amount;
      else map[sid].expense += t.amount;
    });

    return Object.values(map).sort(
      (a, b) => b.income + b.expense - (a.income + a.expense)
    );
  }, [transactions]);


  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in delay-4">
        <p className="section-label mb-3">Ringkasan per Sumber</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div>
                  <div className="skeleton h-4 w-20 mb-1 rounded" />
                  <div className="skeleton h-3 w-14 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-1 w-full mt-3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tidak ada data sumber sama sekali di transaksi bulan ini
  if (sourceStats.length === 0) {
    return (
      <div className="animate-fade-in delay-4">
        <p className="section-label mb-3">Ringkasan per Sumber</p>
        <div
          className="glass-card flex items-center gap-3 p-5"
          style={{ color: "var(--text-secondary)" }}
        >
          <div
            className="icon-badge icon-badge-sm shrink-0"
            style={{ background: "var(--glass-bg-hover)" }}
          >
            <Tags size={16} style={{ color: "var(--text-tertiary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Belum ada data sumber
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Tambahkan sumber pada transaksi agar tampil di sini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in delay-4">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">
          Ringkasan per Sumber
          {monthName && (
            <span
              className="ml-2 normal-case font-normal tracking-normal"
              style={{ color: "var(--text-tertiary)", fontSize: "0.7rem" }}
            >
              — {monthName}
            </span>
          )}
        </p>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)",
          }}
        >
          {sourceStats.length} sumber
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {sourceStats.map((s, idx) => {
          const net = s.income - s.expense;
          const total = s.income + s.expense;

          const incomeRatio = total > 0 ? (s.income / total) * 100 : 0;
          const expenseRatio = total > 0 ? (s.expense / total) * 100 : 0;

          return (
            <div
              key={s.id}
              className={`glass-card p-5 animate-fade-in delay-${Math.min(idx + 1, 6)}`}
              style={{ overflow: "hidden" }}
            >
              {/* Subtle color glow */}
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: s.color,
                  opacity: 0.06,
                  filter: "blur(24px)",
                  pointerEvents: "none",
                }}
              />

              {/* Header */}
              <div
                className="flex items-center gap-3 mb-4"
                style={{ position: "relative" }}
              >
                <div
                  className="icon-badge icon-badge-md"
                  style={{ background: s.color + "1a", fontSize: "1.1rem" }}
                >
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: s.color }}
                  >
                    {s.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {total > 0
                      ? `${incomeRatio.toFixed(0)}% masuk · ${expenseRatio.toFixed(0)}% keluar`
                      : "Belum ada transaksi"}
                  </p>
                </div>
              </div>

              {/* Stats rows */}
              <div
                className="space-y-2 mb-4"
                style={{ position: "relative" }}
              >
                {/* Income */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      size={12}
                      style={{ color: "var(--color-income)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Pemasukan
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "var(--color-income)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    +{formatRupiah(s.income)}
                  </span>
                </div>

                {/* Expense */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown
                      size={12}
                      style={{ color: "var(--color-expense)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Pengeluaran
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "var(--color-expense)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    −{formatRupiah(s.expense)}
                  </span>
                </div>

                {/* Net */}
                <div
                  className="flex items-center justify-between pt-2"
                  style={{
                    borderTop: "1px solid var(--divider)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Minus size={12} style={{ color: "var(--text-tertiary)" }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Net
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: net >= 0 ? "var(--color-income)" : "var(--color-expense)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {net >= 0 ? "+" : "−"}{formatRupiah(Math.abs(net))}
                  </span>
                </div>
              </div>

              {/* Segmented bar: income + expense */}
              <div style={{ position: "relative" }}>
                <div
                  className="flex rounded-full overflow-hidden"
                  style={{ height: 5, background: "var(--divider)" }}
                >
                  {/* Relative width bar */}
                  <div
                    style={{
                      width: `100%`,
                      display: "flex",
                      overflow: "hidden",
                      borderRadius: "9999px",
                    }}
                  >
                    <div
                      style={{
                        flex: incomeRatio,
                        background: "var(--color-income)",
                        transition: "flex 0.5s ease",
                      }}
                    />
                    <div
                      style={{
                        flex: expenseRatio,
                        background: "var(--color-expense)",
                        transition: "flex 0.5s ease",
                      }}
                    />
                  </div>
                </div>
                {/* Bar legend */}
                <div
                  className="flex items-center gap-3 mt-2"
                  style={{ color: "var(--text-tertiary)", fontSize: "0.62rem" }}
                >
                  <span className="flex items-center gap-1">
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--color-income)", display: "inline-block",
                      }}
                    />
                    Masuk
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--color-expense)", display: "inline-block",
                      }}
                    />
                    Keluar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
