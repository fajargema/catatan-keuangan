"use client";

import { useEffect, useRef } from "react";

/**
 * Panggil handler saat tombol Escape ditekan.
 * Dipakai oleh semua modal agar bisa ditutup dengan keyboard.
 *
 * Handler disimpan di ref sehingga listener tidak perlu
 * dilepas-pasang setiap render.
 */
export function useEscapeKey(handler: () => void) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlerRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
