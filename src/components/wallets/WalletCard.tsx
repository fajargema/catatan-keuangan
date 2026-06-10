"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Wallet } from "@/lib/types";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => void;
}

export default function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  const isPositive = wallet.balance >= 0;

  return (
    <div
      className="glass-card p-5 group animate-fade-in cursor-default"
      style={{ overflow: "hidden" }}
    >
      {/* Subtle color glow top-right */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: wallet.color,
          opacity: 0.06,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-5" style={{ position: "relative" }}>
        <div className="flex items-center gap-3">
          <div
            className="icon-badge icon-badge-lg"
            style={{
              background: wallet.color + "18",
              fontSize: "1.25rem",
            }}
          >
            {wallet.icon}
          </div>
          <div>
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {wallet.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Dompet
            </p>
          </div>
        </div>

        {/* Actions (always visible on mobile/tablet, hover on desktop) */}
        <div
          className="flex gap-1 transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          style={{ flexShrink: 0 }}
        >
          <button
            onClick={() => onEdit(wallet)}
            className="theme-toggle"
            style={{ width: 30, height: 30, borderRadius: 8 }}
            aria-label="Edit dompet"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(wallet.id)}
            className="theme-toggle"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              color: "var(--color-expense)",
              borderColor: "rgba(244,63,94,0.2)",
            }}
            aria-label="Hapus dompet"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ position: "relative" }}>
        <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
          Saldo
        </p>
        <p
          className="text-2xl font-bold"
          style={{
            color: isPositive ? wallet.color : "var(--color-expense)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {isPositive ? "" : "−"}{formatRupiah(Math.abs(wallet.balance))}
        </p>
      </div>

      {/* Bottom color accent bar */}
      <div
        className="mt-5 h-0.5 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${wallet.color}70, ${wallet.color}15)`,
        }}
      />
    </div>
  );
}
