"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getCached, setCached } from "@/lib/queryCache";
import { getCurrentYearMonth } from "@/lib/utils";
import type { InvestmentSnapshot } from "@/lib/types";

const EMPTY: InvestmentSnapshot[] = [];

/**
 * Riwayat nilai portofolio per bulan. Tiap bulan punya satu baris
 * (di-upsert), sehingga `captureSnapshot` boleh dipanggil berkali-kali
 * — nilai bulan berjalan hanya diperbarui, bukan menumpuk.
 */
export function useInvestmentSnapshots() {
  const { userId } = useAuth();
  const cacheKey = `investment_snapshots:${userId}`;
  const [snapshots, setSnapshots] = useState<InvestmentSnapshot[]>(
    () => getCached<InvestmentSnapshot[]>(cacheKey) ?? EMPTY
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));

  const fetchSnapshots = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("investment_snapshots")
        .select("id, period, total_value, total_cost, captured_at, user_id")
        .eq("user_id", userId)
        .order("period", { ascending: true });
      if (error) throw error;
      const rows = (data as InvestmentSnapshot[]) || [];
      setSnapshots(rows);
      setCached(cacheKey, rows);
    } catch {
      // Snapshot bersifat pelengkap — gagal memuat tidak memblok halaman.
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSnapshots();
  }, [fetchSnapshots]);

  /**
   * Catat / perbarui snapshot bulan berjalan. Upsert pada (user_id, period)
   * sehingga idempotent — aman dipanggil otomatis saat halaman terbuka.
   */
  const captureSnapshot = useCallback(
    async (totalValue: number, totalCost: number) => {
      if (!userId) return;
      const period = getCurrentYearMonth();

      // Lewati bila nilai bulan ini sudah sama persis (hindari write berlebih)
      const existing = snapshots.find((s) => s.period === period);
      if (
        existing &&
        existing.total_value === totalValue &&
        existing.total_cost === totalCost
      ) {
        return;
      }

      const { error } = await supabase.from("investment_snapshots").upsert(
        {
          user_id: userId,
          period,
          total_value: totalValue,
          total_cost: totalCost,
          captured_at: new Date().toISOString(),
        },
        { onConflict: "user_id,period" }
      );
      if (!error) await fetchSnapshots();
    },
    [userId, snapshots, fetchSnapshots]
  );

  return { snapshots, loading, captureSnapshot, refetch: fetchSnapshots };
}

/**
 * Pasang snapshot bulan berjalan secara otomatis sekali per render-cycle
 * saat data sudah siap. Dibungkus hook agar efek terikat ke siklus React.
 */
export function useAutoSnapshot(
  ready: boolean,
  totalValue: number,
  totalCost: number,
  capture: (v: number, c: number) => Promise<void>
) {
  const doneRef = useRef(false);
  useEffect(() => {
    if (!ready || doneRef.current) return;
    if (totalValue <= 0 && totalCost <= 0) return;
    doneRef.current = true;
    void capture(totalValue, totalCost);
  }, [ready, totalValue, totalCost, capture]);
}
