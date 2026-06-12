"use client";

import { useState } from "react";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { formatRupiah, WALLET_CARD_GRADIENT, WALLET_CARD_SHADOW } from "@/lib/utils";
import type { Wallet } from "@/lib/types";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => void;
}

/** Format created_at menjadi MM/YY ala masa berlaku kartu */
function formatCardDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

export default function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  const [hideBalance, setHideBalance] = useState(false);
  const isPositive = wallet.balance >= 0;

  return (
    <div className="relative animate-fade-in" style={{ paddingTop: 14 }}>
      {/* Tumpukan kartu di belakang (efek stacked deck) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-8 -translate-x-1/2 rounded-t-2xl"
        style={{ width: "84%", background: "#8b84f8", opacity: 0.4 }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 h-8 -translate-x-1/2 rounded-t-2xl"
        style={{ top: 7, width: "92%", background: "#6a61f3", opacity: 0.65 }}
      />

      {/* Kartu utama */}
      <div
        className="group relative z-10 flex flex-col overflow-hidden"
        style={{
          minHeight: 176,
          borderRadius: 18,
          background: WALLET_CARD_GRADIENT,
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: WALLET_CARD_SHADOW,
        }}
      >
        {/* Sheen diagonal glossy */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute"
            style={{
              top: "-30%",
              left: "-15%",
              width: "60%",
              height: "180%",
              background:
                "linear-gradient(100deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 55%, transparent 100%)",
              transform: "skewX(-18deg)",
            }}
          />
        </div>

        {/* Baris atas: logo + nama dompet + aksi */}
        <div className="relative flex items-center justify-between gap-2 px-5 pt-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)" }}
          >
            {wallet.icon}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{wallet.name}</span>
            <div className="flex shrink-0 gap-1 transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
              <button
                onClick={() => onEdit(wallet)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/30"
                aria-label="Edit dompet"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onDelete(wallet.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-rose-500/70"
                aria-label="Hapus dompet"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Band saldo bergaya nomor kartu */}
        <div
          className="relative mt-4 flex items-center justify-between gap-2 px-5 py-2.5"
          style={{ background: "rgba(255,255,255,0.10)" }}
        >
          <p
            className="truncate text-xl font-bold text-white tabular-nums"
            style={{ letterSpacing: "0.08em", textShadow: "0 1px 10px rgba(0,0,0,0.25)" }}
          >
            {hideBalance ? (
              <span aria-label="Saldo disembunyikan">Rp ••••••••</span>
            ) : (
              <>
                {isPositive ? "" : "−"}
                {formatRupiah(Math.abs(wallet.balance))}
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setHideBalance((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
              aria-label={hideBalance ? "Tampilkan saldo" : "Sembunyikan saldo"}
              aria-pressed={hideBalance}
            >
              {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <div aria-hidden className="flex items-center">
              <span className="h-6 w-6 rounded-full bg-white/45" />
              <span className="-ml-2.5 h-6 w-6 rounded-full bg-white/25" />
            </div>
          </div>
        </div>

        {/* Footer band gelap: nama + tanggal ala EXP */}
        <div
          className="relative mt-auto flex items-end justify-between gap-3 px-5 py-3"
          style={{
            background: "rgba(10, 8, 40, 0.28)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {isPositive ? "Nama Dompet" : "Saldo Negatif"}
            </p>
            <p
              className="mt-0.5 truncate text-sm font-bold uppercase text-white"
              style={{ letterSpacing: "0.08em" }}
            >
              {wallet.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Sejak
            </p>
            <p
              className="mt-0.5 text-sm font-bold text-white tabular-nums"
              style={{ letterSpacing: "0.06em" }}
            >
              {formatCardDate(wallet.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
