"use client";

import { formatRupiah } from "@/lib/utils";
import type { Wallet } from "@/lib/types";

interface WalletSummaryProps {
  wallets: Wallet[];
  loading?: boolean;
}

export default function WalletSummary({ wallets, loading }: WalletSummaryProps) {
  if (loading) {
    return (
      <div className="animate-fade-in delay-2">
        <p className="section-label mb-3">Dompet Saya</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
              <div className="skeleton h-6 w-32 rounded" />
              <div className="skeleton h-1 w-full mt-4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="animate-fade-in delay-2">
        <p className="section-label mb-3">Dompet Saya</p>
        <div className="glass-card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Belum ada dompet. Tambahkan di halaman Dompet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in delay-2">
      <p className="section-label mb-3">Dompet Saya</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {wallets.map((wallet, index) => {
          const isPositive = wallet.balance >= 0;
          return (
            <div
              key={wallet.id}
              className={`glass-card p-5 animate-fade-in delay-${Math.min(index + 1, 6)} cursor-default`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="icon-badge icon-badge-sm"
                    style={{ background: wallet.color + "18" }}
                  >
                    <span style={{ fontSize: "1rem" }}>{wallet.icon}</span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {wallet.name}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: wallet.color + "18",
                    color: wallet.color,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                  }}
                >
                  Dompet
                </span>
              </div>

              {/* Balance */}
              <p
                className="text-xl font-bold"
                style={{ color: isPositive ? wallet.color : "var(--color-expense)" }}
              >
                {isPositive ? "" : "-"}{formatRupiah(Math.abs(wallet.balance))}
              </p>

              {/* Color bar */}
              <div
                className="mt-4 h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${wallet.color}60, ${wallet.color}18)`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
