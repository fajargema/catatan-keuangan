"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getCached, setCached } from "@/lib/queryCache";
import type { TransactionWithRelations, TransactionFormData } from "@/lib/types";

const EMPTY_TRANSACTIONS: TransactionWithRelations[] = [];

interface UseTransactionsOptions {
  limit?: number;
  walletId?: string;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  sourceId?: string;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId } = useAuth();
  // Cache key mencakup semua filter agar tiap kombinasi punya entri sendiri
  const cacheKey = `transactions:${userId}:${options.limit ?? ""}:${options.walletId ?? ""}:${options.type ?? ""}:${options.startDate ?? ""}:${options.endDate ?? ""}:${options.sourceId ?? ""}`;
  // Hasil fetch disimpan bersama key-nya; nilai yang ditampilkan diturunkan
  // saat render (stale-while-revalidate): hasil fetch untuk key aktif →
  // fallback cache → []. Tidak perlu setState sinkron saat filter berubah.
  const [result, setResult] = useState<{
    key: string;
    data: TransactionWithRelations[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transactions = useMemo(
    () =>
      result?.key === cacheKey
        ? result.data
        : getCached<TransactionWithRelations[]>(cacheKey) ?? EMPTY_TRANSACTIONS,
    [result, cacheKey]
  );
  // Skeleton hanya saat kombinasi filter ini belum pernah diambil sama sekali
  const loading =
    result?.key !== cacheKey && !getCached(cacheKey) && !error;

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      // Selective columns — only fetch what we actually display
      let query = supabase
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
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.walletId) {
        query = query.eq("wallet_id", options.walletId);
      }
      if (options.type) {
        query = query.eq("type", options.type);
      }
      if (options.startDate) {
        query = query.gte("date", options.startDate);
      }
      if (options.endDate) {
        query = query.lte("date", options.endDate);
      }
      if (options.sourceId) {
        query = query.eq("source_id", options.sourceId);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      const rows = (data as unknown as TransactionWithRelations[]) || [];
      setResult({ key: cacheKey, data: rows });
      setCached(cacheKey, rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat transaksi");
    }
  }, [userId, cacheKey, options.limit, options.walletId, options.type, options.startDate, options.endDate, options.sourceId]);

  useEffect(() => {
    // Fetch-on-mount sah untuk data layer client-only; semua setState di
    // dalamnya terjadi setelah await, bukan sinkron (rule ini konservatif).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  const { skipNextChange } = useRealtimeSubscription({
    table: "transactions",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onChanged: fetchTransactions,
    enabled: !!userId,
  });

  const addTransaction = async (data: TransactionFormData) => {
    if (!userId) return;

    skipNextChange();
    const { error: err } = await supabase
      .from("transactions")
      .insert([{ ...data, user_id: userId }]);
    if (err) throw err;
    await fetchTransactions();
  };

  const updateTransaction = async (id: string, data: TransactionFormData) => {
    if (!userId) return;

    skipNextChange();
    const { error: err } = await supabase
      .from("transactions")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (err) throw err;
    await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    if (!userId) return;

    // Optimistic: remove from local state immediately (+ sinkron ke cache)
    const next = transactions.filter((t) => t.id !== id);
    setResult({ key: cacheKey, data: next });
    setCached(cacheKey, next);

    skipNextChange();
    const { error: err } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      // Rollback on error
      await fetchTransactions();
      throw err;
    }
  };

  // Memoized totals — transfer antar dompet bukan pemasukan/pengeluaran asli
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income" && !t.is_transfer)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense" && !t.is_transfer)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  return {
    transactions,
    loading,
    error,
    totalIncome,
    totalExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
