"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesFilter } from "@supabase/supabase-js";

interface UseRealtimeSubscriptionOptions {
  /** Nama tabel Supabase yang ingin di-subscribe */
  table: string;
  /** Filter channel (contoh: `user_id=eq.abc123`). Opsional. */
  filter?: string;
  /** Callback yang dipanggil saat ada perubahan (setelah debounce) */
  onChanged: () => void;
  /** Durasi debounce dalam ms. Default 300. */
  debounceMs?: number;
  /** Set true untuk skip subscription (misalnya saat userId belum ada) */
  enabled?: boolean;
}

/**
 * useRealtimeSubscription
 *
 * Shared hook untuk subscribe ke Supabase Realtime postgres_changes.
 * Menggantikan pola duplikat realtimeTimerRef + skipNextRealtimeRef
 * yang sebelumnya di-copy di setiap hook data.
 *
 * @returns skipNextChange — panggil sebelum mutasi lokal agar tidak
 *          terjadi double-fetch dari realtime event.
 */
export function useRealtimeSubscription({
  table,
  filter,
  onChanged,
  debounceMs = 300,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef(false);
  // Stable ref untuk callback agar tidak perlu re-subscribe setiap render
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const skipNextChange = () => {
    skipRef.current = true;
  };

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-realtime-${Math.random().toString(36).substring(2, 9)}`;

    const filterConfig: RealtimePostgresChangesFilter<"*"> = {
      event: "*",
      schema: "public",
      table,
      ...(filter ? { filter } : {}),
    };

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", filterConfig, () => {
        if (skipRef.current) {
          skipRef.current = false;
          return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onChangedRef.current();
        }, debounceMs);
      })
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, debounceMs, enabled]);

  return { skipNextChange };
}
