"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah, formatDateShort } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";

interface TopTransactionsProps {
  transactions: TransactionWithRelations[];
}

const TOP_N = 5;

function topByType(
  transactions: TransactionWithRelations[],
  type: "income" | "expense"
): TransactionWithRelations[] {
  return transactions
    .filter((t) => t.type === type)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_N);
}

function TopList({
  title,
  type,
  items,
}: {
  title: string;
  type: "income" | "expense";
  items: TransactionWithRelations[];
}) {
  const isIncome = type === "income";
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const amountClass = isIncome ? "text-income" : "text-expense";

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={amountClass} />
        <h2 className="text-base font-bold">{title}</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state py-6">
          <p className="text-xs text-muted">Belum ada transaksi pada periode ini.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-card-border bg-card-hover/20"
            >
              <span className="w-6 h-6 shrink-0 rounded-md bg-card-hover flex items-center justify-center text-[11px] font-bold text-muted tabular-nums">
                {i + 1}
              </span>
              <span
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-base"
                style={{
                  backgroundColor: (t.category?.color ?? "#94a3b8") + "20",
                }}
              >
                {t.category?.icon ?? "💸"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {t.description || t.category?.name || "Tanpa keterangan"}
                </p>
                <p className="text-[11px] text-muted truncate">
                  {t.category?.name ?? "Lainnya"} · {formatDateShort(t.date)}
                </p>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ${amountClass}`}>
                {isIncome ? "+" : "-"}
                {formatRupiah(t.amount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function TopTransactions({ transactions }: TopTransactionsProps) {
  const topExpenses = useMemo(
    () => topByType(transactions, "expense"),
    [transactions]
  );
  const topIncomes = useMemo(
    () => topByType(transactions, "income"),
    [transactions]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TopList title="Pengeluaran Terbesar" type="expense" items={topExpenses} />
      <TopList title="Pemasukan Terbesar" type="income" items={topIncomes} />
    </div>
  );
}
