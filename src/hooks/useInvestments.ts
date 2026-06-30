"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getCached, setCached } from "@/lib/queryCache";
import type { Investment, InvestmentFormData } from "@/lib/types";

export function useInvestments() {
  const { userId } = useAuth();
  const cacheKey = `investments:${userId}`;
  // Stale-while-revalidate: tampilkan data cache dulu, revalidasi di belakang
  const [investments, setInvestments] = useState<Investment[]>(
    () => getCached<Investment[]>(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref for realtime
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRealtimeRef = useRef(false);

  const fetchInvestmentsData = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: invData, error: invErr } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (invErr) throw invErr;
      setInvestments(invData || []);
      setCached(cacheKey, invData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data investasi");
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    // Fetch-on-mount sah untuk data layer client-only; semua setState di
    // dalamnya terjadi setelah await, bukan sinkron (rule ini konservatif).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvestmentsData();

    if (!userId) return;

    // Listen to changes in investments table
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const invChannel = supabase
      .channel(`investments-changes-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "investments",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (skipNextRealtimeRef.current) {
            skipNextRealtimeRef.current = false;
            return;
          }

          if (realtimeTimerRef.current) {
            clearTimeout(realtimeTimerRef.current);
          }
          realtimeTimerRef.current = setTimeout(() => {
            fetchInvestmentsData();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current);
      }
      supabase.removeChannel(invChannel);
    };
  }, [fetchInvestmentsData, userId]);

  // Mutations
  const addInvestment = async (data: InvestmentFormData) => {
    if (!userId) return;

    skipNextRealtimeRef.current = true;
    const { data: inserted, error: err } = await supabase
      .from("investments")
      .insert([{ ...data, user_id: userId }])
      .select();
    if (err) throw err;
    await fetchInvestmentsData();
    return inserted?.[0] as Investment;
  };

  const updateInvestment = async (id: string, data: InvestmentFormData) => {
    if (!userId) return;

    // Optimistic update (sinkron ke cache)
    const nextUpdated = investments.map((inv) =>
      inv.id === id ? { ...inv, ...data } : inv
    );
    setInvestments(nextUpdated);
    setCached(cacheKey, nextUpdated);

    skipNextRealtimeRef.current = true;
    const { data: updated, error: err } = await supabase
      .from("investments")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (err) {
      await fetchInvestmentsData();
      throw err;
    }
    return updated?.[0] as Investment;
  };

  const deleteInvestment = async (id: string) => {
    if (!userId) return;

    // Optimistic delete (sinkron ke cache)
    const nextDeleted = investments.filter((inv) => inv.id !== id);
    setInvestments(nextDeleted);
    setCached(cacheKey, nextDeleted);

    skipNextRealtimeRef.current = true;
    const { error: err } = await supabase
      .from("investments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      await fetchInvestmentsData();
      throw err;
    }
  };

  // Calculations
  const totalCurrent = investments.reduce((sum, inv) => sum + Number(inv.current_val || 0), 0);
  const totalCost = investments.reduce((sum, inv) => sum + Number(inv.cost_basis || 0), 0);

  return {
    investments,
    loading,
    error,
    totalCurrent,
    totalCost,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    refetch: fetchInvestmentsData,
  };
}
