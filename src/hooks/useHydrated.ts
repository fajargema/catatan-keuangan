"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `true` setelah hydration di client, `false` saat SSR/prerender.
 *
 * Pengganti pola `isMounted` + setState-in-effect untuk menunda render
 * komponen yang tidak aman di server (mis. chart yang mengukur DOM).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
