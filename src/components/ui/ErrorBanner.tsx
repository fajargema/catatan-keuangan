"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  /** Pesan error yang ditampilkan ke user */
  message: string;
  /** Callback untuk mencoba memuat ulang data. Tombol disembunyikan jika tidak diisi. */
  onRetry?: () => void;
}

/**
 * Banner error standar untuk kegagalan memuat data.
 * Dipakai di halaman-halaman yang datanya berasal dari hooks
 * (useWallets, useTransactions, dst.) agar kegagalan fetch
 * tidak tampil sebagai "data kosong" tanpa penjelasan.
 */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 p-4 rounded-2xl animate-fade-in"
      style={{
        background: "var(--color-expense-dim)",
        border: "1px solid color-mix(in srgb, var(--color-expense) 25%, transparent)",
      }}
    >
      <AlertCircle size={18} className="text-expense shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-expense">Gagal memuat data</p>
        <p className="text-xs text-muted mt-0.5 truncate">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary shrink-0 !px-3 !py-2 text-xs">
          <RefreshCw size={13} />
          Coba lagi
        </button>
      )}
    </div>
  );
}
