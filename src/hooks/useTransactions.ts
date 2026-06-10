"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getCached, setCached } from "@/lib/queryCache";
import type { TransactionWithRelations, TransactionFormData } from "@/lib/types";

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
  // Stale-while-revalidate: tampilkan data cache dulu, revalidasi di belakang
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    () => getCached<TransactionWithRelations[]>(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      // Saat filter berubah, pakai cache untuk filter tsb bila ada;
      // skeleton hanya muncul saat datanya benar-benar belum pernah diambil
      const cached = getCached<TransactionWithRelations[]>(cacheKey);
      if (cached) {
        setTransactions(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

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
      const result = (data as unknown as TransactionWithRelations[]) || [];
      setTransactions(result);
      setCached(cacheKey, result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey, options.limit, options.walletId, options.type, options.startDate, options.endDate, options.sourceId]);

  useEffect(() => {
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
    setTransactions(next);
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
