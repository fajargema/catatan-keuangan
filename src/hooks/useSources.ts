"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getCached, setCached } from "@/lib/queryCache";
import type { Source, SourceFormData } from "@/lib/types";

export function useSources() {
  const { userId } = useAuth();
  const cacheKey = `sources:${userId}`;
  // Stale-while-revalidate: tampilkan data cache dulu, revalidasi di belakang
  const [sources, setSources] = useState<Source[]>(
    () => getCached<Source[]>(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch global seeds (user_id is null) + user-owned sources
      const { data, error: err } = await supabase
        .from("sources")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      if (err) throw err;
      setSources(data || []);
      setCached(cacheKey, data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sumber");
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    // Fetch-on-mount sah untuk data layer client-only; semua setState di
    // dalamnya terjadi setelah await, bukan sinkron (rule ini konservatif).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSources();
  }, [fetchSources]);

  const { skipNextChange } = useRealtimeSubscription({
    table: "sources",
    // sources tidak difilter per-user_id di realtime karena ada global seeds
    onChanged: fetchSources,
    enabled: !!userId,
  });

  const addSource = async (data: SourceFormData) => {
    if (!userId) return;

    skipNextChange();
    const { error: err } = await supabase
      .from("sources")
      .insert([{ ...data, user_id: userId }]);
    if (err) throw err;
    await fetchSources();
  };

  const updateSource = async (id: string, data: Partial<SourceFormData>) => {
    if (!userId) return;

    // Optimistic update (sinkron ke cache)
    const next = sources.map((s) => (s.id === id ? { ...s, ...data } : s));
    setSources(next);
    setCached(cacheKey, next);

    skipNextChange();
    const { error: err } = await supabase
      .from("sources")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      await fetchSources();
      throw err;
    }
  };

  const deleteSource = async (id: string) => {
    if (!userId) return;

    // Optimistic delete (sinkron ke cache)
    const next = sources.filter((s) => s.id !== id);
    setSources(next);
    setCached(cacheKey, next);

    skipNextChange();
    const { error: err } = await supabase
      .from("sources")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (err) {
      await fetchSources();
      throw err;
    }
  };

  return {
    sources,
    loading,
    error,
    addSource,
    updateSource,
    deleteSource,
    refetch: fetchSources,
  };
}
