"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getCached, setCached } from "@/lib/queryCache";
import type { Wallet, WalletFormData } from "@/lib/types";

export function useWallets() {
  const { userId } = useAuth();
  const cacheKey = `wallets:${userId}`;
  // Stale-while-revalidate: tampilkan data cache dulu, revalidasi di belakang
  const [wallets, setWallets] = useState<Wallet[]>(
    () => getCached<Wallet[]>(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    if (!userId) return;

    try {
      // Skeleton hanya saat belum ada data sama sekali (hindari kedip saat refetch)
      if (!getCached(cacheKey)) setLoading(true);

      const { data, error: err } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (err) throw err;
      setWallets(data || []);
      setCached(cacheKey, data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dompet");
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const { skipNextChange } = useRealtimeSubscription({
    table: "wallets",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onChanged: fetchWallets,
    enabled: !!userId,
  });

  const addWallet = async (data: WalletFormData) => {
    if (!userId) return;

    skipNextChange();
    const { error: err } = await supabase
      .from("wallets")
      .insert([{ ...data, user_id: userId }]);
    if (err) throw err;
    await fetchWallets();
  };

  const updateWallet = async (id: string, data: Partial<WalletFormData>) => {
    if (!userId) return;

    // Optimistic update (sinkron ke cache agar navigasi tidak menampilkan data lama)
    const next = wallets.map((w) =>
      w.id === id ? { ...w, ...data, updated_at: new Date().toISOString() } : w
    );
    setWallets(next);
    setCached(cacheKey, next);

    skipNextChange();
    const { error: err } = await supabase
      .from("wallets")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      // Rollback on error
      await fetchWallets();
      throw err;
    }
  };

  const deleteWallet = async (id: string) => {
    if (!userId) return;

    // Optimistic delete
    const next = wallets.filter((w) => w.id !== id);
    setWallets(next);
    setCached(cacheKey, next);

    skipNextChange();
    const { error: err } = await supabase
      .from("wallets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      await fetchWallets();
      throw err;
    }
  };

  const transferBetweenWallets = async (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    date: string,
    notes?: string
  ) => {
    if (!userId) throw new Error("Tidak terautentikasi");

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const toWallet = wallets.find((w) => w.id === toWalletId);
    if (!fromWallet || !toWallet) throw new Error("Dompet tidak ditemukan");

    const notesSuffix = notes ? ` — ${notes}` : "";

    // Insert two transactions atomically
    const { error: err } = await supabase.from("transactions").insert([
      {
        user_id: userId,
        type: "expense",
        amount,
        description: `[TRANSFER] ke ${toWallet.name}${notesSuffix}`,
        category_id: null,
        wallet_id: fromWalletId,
        is_transfer: true,
        date,
      },
      {
        user_id: userId,
        type: "income",
        amount,
        description: `[TRANSFER] dari ${fromWallet.name}${notesSuffix}`,
        category_id: null,
        wallet_id: toWalletId,
        is_transfer: true,
        date,
      },
    ]);

    if (err) throw err;
    await fetchWallets();
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return {
    wallets,
    loading,
    error,
    totalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    transferBetweenWallets,
    refetch: fetchWallets,
  };
}
