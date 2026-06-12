"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "balance-hidden";
const listeners = new Set<() => void>();
let hidden = false;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  try {
    hidden = localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage bisa tidak tersedia (mis. private mode) — abaikan
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  init();
  return hidden;
}

function getServerSnapshot(): boolean {
  return false;
}

function toggleHidden() {
  init();
  hidden = !hidden;
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0");
  } catch {
    // abaikan
  }
  listeners.forEach((listener) => listener());
}

/**
 * Visibilitas total saldo — shared antar halaman (dashboard & dompet)
 * dan persist antar sesi via localStorage.
 */
export function useBalanceVisibility(): { hidden: boolean; toggle: () => void } {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { hidden: value, toggle: toggleHidden };
}
