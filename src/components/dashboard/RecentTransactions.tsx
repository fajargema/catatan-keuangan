"use client";

import { formatRupiah, formatDate } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, History, ChevronRight } from "lucide-react";
import type { TransactionWithRelations } from "@/lib/types";
import Link from "next/link";

interface RecentTransactionsProps {
  transactions: TransactionWithRelations[];
  loading?: boolean;
}

export default function RecentTransactions({
  transactions,
  loading,
}: RecentTransactionsProps) {
  const Header = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className="icon-badge"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "var(--accent-indigo-dim)",
          }}
        >
          <History size={14} style={{ color: "var(--accent-indigo)" }} />
        </div>
        <span className="section-label">Transaksi Terbaru</span>
      </div>
      <Link
        href="/transactions"
        className="flex items-center gap-1 text-xs font-semibold transition-colors text-muted hover:text-accent"
      >
        Lihat Semua <ChevronRight size={13} />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-fade-in delay-3">
        <Header />
        <div
          className="glass-card overflow-hidden"
          style={{ borderRadius: 18 }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="px-5 py-4 flex items-center justify-between"
              style={{
                borderBottom:
                  i < 5 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div>
                  <div className="skeleton h-3.5 w-28 mb-1.5 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="animate-fade-in delay-3">
        <Header />
        <div className="glass-card empty-state" style={{ padding: "48px 24px" }}>
          <History size={40} style={{ color: "var(--text-tertiary)", opacity: 0.4, marginBottom: 12 }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Belum ada transaksi
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Transaksi terbaru akan muncul di sini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in delay-3">
      <Header />
      <div className="glass-card overflow-hidden">
        {transactions.map((t, i) => {
          const isIncome = t.type === "income";
          return (
            <div
              key={t.id}
              className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3"
              style={{
                borderBottom:
                  i < transactions.length - 1
                    ? "1px solid var(--divider)"
                    : "none",
                transition: "background 0.15s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--glass-bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Icon */}
              <div
                className="icon-badge icon-badge-sm shrink-0"
                style={{
                  background: isIncome
                    ? "var(--color-income-dim)"
                    : "var(--color-expense-dim)",
                  fontSize: "1rem",
                }}
              >
                {t.category?.icon ? (
                  <span>{t.category.icon}</span>
                ) : isIncome ? (
                  <ArrowUpRight size={15} style={{ color: "var(--color-income)" }} />
                ) : (
                  <ArrowDownRight size={15} style={{ color: "var(--color-expense)" }} />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs sm:text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t.description || t.category?.name || "Transaksi"}
                </p>
                <div
                  className="flex items-center gap-1.5 mt-0.5 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {t.source && (
                    <span
                      className="badge whitespace-nowrap shrink-0"
                      style={{
                        background: t.source.color + "14",
                        color: t.source.color,
                        border: `1px solid ${t.source.color}28`,
                        fontSize: "0.6rem",
                        padding: "1px 6px",
                      }}
                    >
                      {t.source.icon} {t.source.name}
                    </span>
                  )}
                  {t.wallet && (
                    <span
                      className="badge whitespace-nowrap shrink-0 flex items-center gap-1"
                      style={{
                        background: "var(--glass-bg-hover)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--glass-border)",
                        fontSize: "0.6rem",
                        padding: "1px 6px",
                      }}
                    >
                      <span>{t.wallet.icon}</span> <span>{t.wallet.name}</span>
                    </span>
                  )}
                  {t.category && (
                    <span className="flex items-center gap-1 shrink-0">
                      <span
                        style={{
                          display: "inline-block",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: t.category.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="text-[0.6rem] whitespace-nowrap"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {t.category.name}
                      </span>
                    </span>
                  )}
                  <span
                    className="text-[0.6rem] whitespace-nowrap shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {formatDate(t.date)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <span
                className="text-xs sm:text-sm font-bold shrink-0 tabular-nums"
                style={{
                  color: isIncome ? "var(--color-income)" : "var(--color-expense)",
                }}
              >
                {isIncome ? "+" : "−"}{formatRupiah(t.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
