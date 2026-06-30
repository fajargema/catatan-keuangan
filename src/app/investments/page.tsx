"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  TrendingUp as ProfitIcon,
  TrendingDown,
  FileText,
  Layers,
  Crown,
  Wallet as WalletIcon,
} from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { useInvestmentSnapshots, useAutoSnapshot } from "@/hooks/useInvestmentSnapshots";
import { useHydrated } from "@/hooks/useHydrated";
import { formatRupiah } from "@/lib/utils";
import type { Investment, InvestmentType, InvestmentFormData } from "@/lib/types";
import InvestmentForm from "@/components/investments/InvestmentForm";
import PortfolioGrowthChart from "@/components/investments/PortfolioGrowthChart";
import ErrorBanner from "@/components/ui/ErrorBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const TYPE_LABELS: Record<InvestmentType, string> = {
  saham: "Saham",
  reksadana: "Reksadana",
  crypto: "Crypto",
  emas: "Emas",
  obligasi: "Obligasi / SBN",
  lainnya: "Lainnya",
};

const TYPE_ICONS: Record<InvestmentType, string> = {
  saham: "📈",
  reksadana: "💼",
  crypto: "🪙",
  emas: "✨",
  obligasi: "📜",
  lainnya: "💵",
};

const TYPE_COLORS: Record<InvestmentType, string> = {
  saham: "#10b981",       // emerald
  reksadana: "#3b82f6",   // blue
  crypto: "#f59e0b",     // amber
  emas: "#a855f7",       // purple
  obligasi: "#ec4899",   // pink
  lainnya: "#64748b",     // slate
};

export default function InvestmentsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Investment | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Investment | null>(null);
  // Chart hanya dirender setelah hydration (recharts mengukur DOM)
  const isMounted = useHydrated();

  const {
    investments,
    loading,
    error,
    totalCurrent,
    totalCost,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    refetch,
  } = useInvestments();

  const { snapshots, captureSnapshot } = useInvestmentSnapshots();
  // Catat snapshot bulan berjalan otomatis sekali data siap (idempotent)
  useAutoSnapshot(!loading, totalCurrent, totalCost, captureSnapshot);

  // Untung/rugi total portofolio
  const totalGain = totalCurrent - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const hasCostData = totalCost > 0;

  // Urutkan aset dari nilai terbesar → hierarki visual yang jelas
  const sortedInvestments = useMemo(
    () =>
      [...investments].sort(
        (a, b) => Number(b.current_val || 0) - Number(a.current_val || 0)
      ),
    [investments]
  );

  // Pie chart data — agregasi per jenis instrumen
  const chartData = useMemo(() => {
    const grouped: Record<string, { value: number; color: string }> = {};
    investments.forEach((inv) => {
      const val = Number(inv.current_val || 0);
      if (val > 0) {
        const label = TYPE_LABELS[inv.type];
        if (!grouped[label]) {
          grouped[label] = { value: 0, color: TYPE_COLORS[inv.type] };
        }
        grouped[label].value += val;
      }
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);
  }, [investments]);

  // Statistik turunan untuk kartu ringkasan
  const typesCount = chartData.length;
  const largest = sortedInvestments[0];
  const largestPct =
    largest && totalCurrent > 0
      ? (Number(largest.current_val || 0) / totalCurrent) * 100
      : 0;

  const handleAddInvestmentAsset = async (data: InvestmentFormData) => {
    await addInvestment(data);
  };

  const handleUpdateInvestmentAsset = async (data: InvestmentFormData) => {
    if (editingAsset) {
      await updateInvestment(editingAsset.id, data);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-right">
        <div>
          <h1 className="text-2xl font-bold mb-1">Investasi</h1>
          <p className="text-sm text-muted">Pantau daftar dan nilai aset investasi Anda</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
          id="add-asset-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Aset</span>
        </button>
      </div>

      {/* Error dari fetch data */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="animate-fade-in">
        {/* Hero — gradient indigo/cyan, beda nuansa dari saldo dompet */}
        <div
          className="relative overflow-hidden rounded-[22px] p-6 sm:p-7"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.12) 45%, rgba(16,185,129,0.14) 100%)",
            border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          {/* Glow orbs */}
          <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 w-44 h-44 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)" }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="icon-badge icon-badge-sm" style={{ background: "rgba(99,102,241,0.18)" }}>
                <ProfitIcon size={16} style={{ color: "var(--accent-indigo)" }} />
              </span>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">
                Total Nilai Investasi
              </p>
            </div>

            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums">
              {loading ? "Rp --" : formatRupiah(totalCurrent)}
            </p>

            {/* Untung/rugi terhadap modal */}
            {!loading && hasCostData ? (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums"
                  style={{
                    background: totalGain >= 0 ? "var(--color-income-dim)" : "var(--color-expense-dim)",
                    color: totalGain >= 0 ? "var(--color-income)" : "var(--color-expense)",
                  }}
                >
                  {totalGain >= 0 ? <ProfitIcon size={12} /> : <TrendingDown size={12} />}
                  {totalGain >= 0 ? "+" : ""}{formatRupiah(totalGain)}
                </span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: totalGain >= 0 ? "var(--color-income)" : "var(--color-expense)" }}
                >
                  ({totalGain >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%)
                </span>
                <span className="text-[11px] text-muted">dari modal {formatRupiah(totalCost)}</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted mt-1.5">
                Valuasi kumulatif seluruh instrumen aktif saat ini
              </p>
            )}

            {/* Mini-stats di dalam hero */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl px-3.5 py-2.5 bg-foreground/3 border border-card-border backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wide font-medium mb-0.5">
                  <WalletIcon size={11} /> Instrumen
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {loading ? "--" : investments.length}
                </p>
              </div>
              <div className="rounded-xl px-3.5 py-2.5 bg-foreground/3 border border-card-border backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wide font-medium mb-0.5">
                  <Layers size={11} /> Jenis Aset
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {loading ? "--" : typesCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Assets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Aset Portofolio</h2>
            <span className="text-xs text-muted">{investments.length} Aset</span>
          </div>

          {loading ? (
            <div className="glass-card divide-y divide-card-border overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div>
                      <div className="skeleton h-4 w-28 mb-1" />
                      <div className="skeleton h-3 w-40" />
                    </div>
                  </div>
                  <div className="skeleton h-5 w-24" />
                </div>
              ))}
            </div>
          ) : investments.length === 0 ? (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center text-muted min-h-[220px]">
              <ProfitIcon size={44} className="opacity-20 mb-3" />
              <p className="font-semibold text-foreground text-sm">Belum ada aset investasi</p>
              <p className="text-xs mt-1">Tambahkan aset pertama Anda untuk mulai mencatat.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-secondary text-xs mt-4 py-1.5 px-3"
              >
                Tambah Aset Baru
              </button>
            </div>
          ) : (
            <div className="glass-card divide-y divide-card-border overflow-hidden">
              {sortedInvestments.map((inv) => {
                const assetColor = TYPE_COLORS[inv.type];
                const val = Number(inv.current_val || 0);
                const cost = Number(inv.cost_basis || 0);
                const gain = val - cost;
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                const hasCost = cost > 0;
                const pct = totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;

                return (
                  <div
                    key={inv.id}
                    className="relative p-4 hover:bg-card-hover/20 transition-colors group"
                  >
                    {/* Aksen warna jenis di tepi kiri */}
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 rounded-r-full opacity-70"
                      style={{ background: assetColor }}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${assetColor}15` }}
                        >
                          {TYPE_ICONS[inv.type]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{inv.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                            <span
                              className="font-medium text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: `${assetColor}14`, color: assetColor }}
                            >
                              {TYPE_LABELS[inv.type]}
                            </span>
                            {inv.units != null && (
                              <span className="tabular-nums">
                                {inv.units.toLocaleString("id-ID")} unit
                              </span>
                            )}
                            {inv.notes && <span className="truncate max-w-[120px] sm:max-w-none">{inv.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 pl-13 sm:pl-0">
                        {/* Current Value + untung/rugi / porsi portofolio */}
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-foreground tabular-nums">{formatRupiah(val)}</p>
                          {hasCost ? (
                            <p
                              className="text-[11px] font-semibold mt-0.5 tabular-nums"
                              style={{ color: gain >= 0 ? "var(--color-income)" : "var(--color-expense)" }}
                            >
                              {gain >= 0 ? "+" : ""}{formatRupiah(gain)} ({gain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted mt-0.5">{pct.toFixed(1)}% portofolio</p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingAsset(inv)}
                            className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors cursor-pointer"
                            title="Ubah Nilai / Detail Aset"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingAsset(inv)}
                            className="p-2 rounded-lg hover:bg-expense/10 text-muted hover:text-expense transition-colors cursor-pointer"
                            title="Hapus Aset"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bar alokasi terhadap total portofolio */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-card-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, background: assetColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Chart Allocation */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Alokasi Aset</h2>

          <div className="glass-card p-5 flex flex-col items-center justify-center min-h-[295px]">
            {loading ? (
              <div className="skeleton w-36 h-36 rounded-full" />
            ) : chartData.length === 0 ? (
              <div className="text-center text-muted p-6">
                <FileText size={32} className="opacity-20 mb-2 mx-auto" />
                <p className="text-xs">Visualisasi alokasi portofolio akan muncul di sini setelah Anda mengisi nilai aset.</p>
              </div>
            ) : (
              <div className="w-full h-full min-h-[250px] flex flex-col justify-between">
                {/* Donut dengan label total di tengah */}
                <div className="relative w-full h-[190px]">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={84}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => formatRupiah(Number(val))}
                          contentStyle={{ background: "var(--modal-bg)", border: "1px solid var(--card-border, rgba(148,163,184,0.15))", borderRadius: "10px", color: "var(--text-primary)", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* Label tengah */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-muted uppercase tracking-wide">Total</span>
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {formatRupiah(totalCurrent)}
                    </span>
                    <span className="text-[10px] text-muted">{typesCount} jenis</span>
                  </div>
                </div>

                {/* Legend lengkap — warna · nama · nominal · % */}
                <div className="space-y-2 mt-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted truncate min-w-0 flex-1">{item.name}</span>
                      <span className="text-foreground tabular-nums hidden sm:inline">{formatRupiah(item.value)}</span>
                      <span className="font-semibold text-foreground shrink-0 tabular-nums w-9 text-right">
                        {totalCurrent > 0 ? ((item.value / totalCurrent) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aset Terbesar — di bawah alokasi */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wide font-medium mb-3">
              <Crown size={12} style={{ color: "#f59e0b" }} /> Aset Terbesar
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-4 w-24" />
              </div>
            ) : largest ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${TYPE_COLORS[largest.type]}15` }}
                  >
                    {TYPE_ICONS[largest.type]}
                  </span>
                  <p className="text-sm font-semibold text-foreground truncate">{largest.name}</p>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {formatRupiah(Number(largest.current_val || 0))}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {largestPct.toFixed(0)}% dari total portofolio
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Belum ada aset</p>
            )}
          </div>
        </div>
      </div>

      {/* Grafik pertumbuhan portofolio — butuh ≥2 bulan tercatat */}
      {isMounted && !loading && snapshots.length >= 2 && (
        <PortfolioGrowthChart snapshots={snapshots} />
      )}

      {/* Modal Tambah Aset */}
      {showAddForm && (
        <InvestmentForm
          onSubmit={handleAddInvestmentAsset}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Modal Edit Aset */}
      {editingAsset && (
        <InvestmentForm
          key={editingAsset.id}
          investment={editingAsset}
          onSubmit={handleUpdateInvestmentAsset}
          onClose={() => setEditingAsset(null)}
        />
      )}

      {/* Konfirmasi hapus aset */}
      {deletingAsset && (
        <ConfirmDialog
          title="Hapus Aset Investasi?"
          message={`Aset "${deletingAsset.name}" akan terhapus permanen. Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          onConfirm={() => {
            deleteInvestment(deletingAsset.id);
            setDeletingAsset(null);
          }}
          onCancel={() => setDeletingAsset(null)}
        />
      )}
    </div>
  );
}
