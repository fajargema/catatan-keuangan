"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil, ArrowUpRight, ArrowDownRight, ChevronDown, ArrowUp } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/context/ToastContext";

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  loading?: boolean;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (transaction: TransactionWithRelations) => void;
}

const PAGE_SIZE = 20;

export default function TransactionList({
  transactions,
  loading,
  onDelete,
  onEdit,
}: TransactionListProps) {
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const deletingTransaction = transactions.find((t) => t.id === deletingId);

  // Reset visible count when transactions change (e.g. filter changed)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [transactions.length]);

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i, idx) => (
          <div
            key={i}
            className="px-5 py-4 flex items-center justify-between"
            style={{
              borderBottom: idx < 6 ? "1px solid var(--divider)" : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div>
                <div className="skeleton h-3.5 w-32 mb-1.5 rounded" />
                <div className="skeleton h-3 w-44 rounded" />
              </div>
            </div>
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-card empty-state">
        <ArrowUpRight
          size={48}
          style={{ color: "var(--text-tertiary)", opacity: 0.3, marginBottom: 16 }}
        />
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Tidak ada transaksi
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Transaksi yang sesuai filter akan muncul di sini.
        </p>
      </div>
    );
  }

  // Slice visible transactions
  const visibleTransactions = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;
  const remainingCount = transactions.length - visibleCount;

  // Group by date
  const grouped: Record<string, TransactionWithRelations[]> = {};
  visibleTransactions.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  return (
    <>
      <div className="space-y-5" ref={listRef}>
        {Object.entries(grouped).map(([date, txns]) => (
          <div key={date} className="animate-fade-in">
            {/* Date label */}
            <div className="flex items-center gap-3 mb-2 px-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}
              >
                {formatDate(date)}
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "var(--divider)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                {txns.length} transaksi
              </span>
            </div>

            {/* Transaction rows */}
            <div className="glass-card overflow-hidden">
              {txns.map((t, idx) => {
                const isIncome = t.type === "income";
                return (
                  <div
                    key={t.id}
                    className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 group"
                    style={{
                      borderBottom:
                        idx < txns.length - 1
                          ? "1px solid var(--divider)"
                          : "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--glass-bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Category icon — hidden on very small screens */}
                    <div
                      className="icon-badge icon-badge-sm shrink-0 text-base hidden xs:flex sm:flex"
                      style={{
                        background: isIncome
                          ? "var(--color-income-dim)"
                          : "var(--color-expense-dim)",
                        display: "flex",
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

                    {/* Description + meta — grows */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs sm:text-sm font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.description || t.category?.name || "Transaksi"}
                      </p>
                      {/* Badges row — scrollable on mobile */}
                      <div
                        className="flex items-center gap-1.5 mt-0.5 overflow-x-auto"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {t.category && (
                          <span
                            className="badge whitespace-nowrap shrink-0"
                            style={{
                              background: t.category.color + "14",
                              color: t.category.color,
                              border: `1px solid ${t.category.color}28`,
                              fontSize: "0.65rem",
                              padding: "2px 7px",
                            }}
                          >
                            {t.category.name}
                          </span>
                        )}
                        {t.source && (
                          <span
                            className="badge whitespace-nowrap shrink-0"
                            style={{
                              background: t.source.color + "14",
                              color: t.source.color,
                              border: `1px solid ${t.source.color}28`,
                              fontSize: "0.65rem",
                              padding: "2px 7px",
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
                              fontSize: "0.65rem",
                              padding: "2px 7px",
                            }}
                          >
                            <span>{t.wallet.icon}</span> <span>{t.wallet.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* Amount */}
                      <span
                        className="text-xs sm:text-sm font-bold tabular-nums"
                        style={{
                          color: isIncome ? "var(--color-income)" : "var(--color-expense)",
                        }}
                      >
                        {isIncome ? "+" : "−"}{formatRupiah(t.amount)}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(t)}
                          className="theme-toggle"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            color: "var(--color-income)",
                            borderColor: "rgba(16,185,129,0.18)",
                          }}
                          aria-label="Edit transaksi"
                          title="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="theme-toggle"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            color: "var(--color-expense)",
                            borderColor: "rgba(244,63,94,0.18)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(244,63,94,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                          }}
                          aria-label="Hapus transaksi"
                          title="Hapus"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 group/more"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--glass-bg-hover)";
              e.currentTarget.style.borderColor = "var(--glass-border-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ChevronDown size={16} className="group-hover/more:translate-y-0.5 transition-transform duration-200" />
            <span>Muat {Math.min(remainingCount, PAGE_SIZE)} Transaksi Lagi</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--accent-indigo-dim)",
                color: "var(--accent-indigo)",
              }}
            >
              {remainingCount} tersisa
            </span>
          </button>
        )}

        {/* All loaded indicator */}
        {!hasMore && transactions.length > PAGE_SIZE && (
          <div
            className="text-center py-3 text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            Semua {transactions.length} transaksi telah dimuat
          </div>
        )}
      </div>

      {/* Scroll to Top FAB */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-24 lg:bottom-6 right-6 z-30 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
        style={{
          background: "var(--accent-indigo)",
          color: "white",
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? "auto" : "none",
          transform: showScrollTop ? "translateY(0) scale(1)" : "translateY(16px) scale(0.8)",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
        }}
        aria-label="Scroll ke atas"
        title="Kembali ke atas"
      >
        <ArrowUp size={18} />
      </button>

      {deletingId && (
        <ConfirmDialog
          title="Hapus Transaksi"
          message={`Yakin ingin menghapus transaksi "${
            deletingTransaction?.description ||
            deletingTransaction?.category?.name ||
            "ini"
          }"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          onConfirm={async () => {
            const id = deletingId;
            setDeletingId(null);
            try {
              await onDelete(id);
              showToast("Transaksi berhasil dihapus.", "success");
            } catch {
              showToast("Gagal menghapus transaksi.", "error");
            }
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  );
}
