"use client";

import { formatRupiah, WALLET_CARD_GRADIENT, WALLET_CARD_SHADOW } from "@/lib/utils";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import type { Wallet } from "@/lib/types";

interface WalletSummaryProps {
  wallets: Wallet[];
  loading?: boolean;
}

export default function WalletSummary({ wallets, loading }: WalletSummaryProps) {
  const { hidden: hideBalance } = useBalanceVisibility();
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
              className={`relative flex flex-col overflow-hidden animate-fade-in delay-${Math.min(index + 1, 6)} cursor-default`}
              style={{
                minHeight: 116,
                borderRadius: 16,
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
                      "linear-gradient(100deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 55%, transparent 100%)",
                    transform: "skewX(-18deg)",
                  }}
                />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between gap-2 px-4 pt-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs"
                    style={{ background: "rgba(255,255,255,0.22)" }}
                  >
                    {wallet.icon}
                  </span>
                  <span className="truncate text-sm font-bold text-white">
                    {wallet.name}
                  </span>
                </div>
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {isPositive ? "Dompet" : "Negatif"}
                </span>
              </div>

              {/* Band saldo + lingkaran overlap ala logo kartu */}
              <div
                className="relative mt-auto flex items-center justify-between gap-2 px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                <p
                  className="truncate text-base font-bold text-white tabular-nums"
                  style={{ letterSpacing: "0.05em", textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}
                >
                  {hideBalance ? (
                    <span aria-label="Saldo disembunyikan">Rp ••••••••</span>
                  ) : (
                    <>
                      {isPositive ? "" : "−"}{formatRupiah(Math.abs(wallet.balance))}
                    </>
                  )}
                </p>
                <div aria-hidden className="flex shrink-0 items-center">
                  <span className="h-5 w-5 rounded-full bg-white/45" />
                  <span className="-ml-2 h-5 w-5 rounded-full bg-white/25" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
