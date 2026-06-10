"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Pencil,
  TrendingUp as ProfitIcon, 
  FileText 
} from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { formatRupiah } from "@/lib/utils";
import type { Investment, InvestmentType } from "@/lib/types";
import InvestmentForm from "@/components/investments/InvestmentForm";
import ErrorBanner from "@/components/ui/ErrorBanner";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    investments,
    loading,
    error,
    totalCurrent,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    refetch,
  } = useInvestments();

  // Pie chart data
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

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }));
  }, [investments]);

  const handleAddInvestmentAsset = async (data: {
    name: string;
    type: InvestmentType;
    current_val: number;
    notes?: string;
  }) => {
    await addInvestment(data);
  };

  const handleUpdateInvestmentAsset = async (data: {
    name: string;
    type: InvestmentType;
    current_val: number;
    notes?: string;
  }) => {
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <div className="glass-card p-5 md:col-span-2 relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/15 transition-colors duration-500" />
          <p className="text-xs text-muted mb-1 font-medium">Total Nilai Investasi</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {loading ? "Rp --" : formatRupiah(totalCurrent)}
          </p>
          <p className="text-[10px] text-muted mt-2">Valuasi kumulatif seluruh instrumen aktif saat ini</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs text-muted mb-1 font-medium">Jumlah Instrumen</p>
          <p className="text-3xl font-bold text-foreground">
            {loading ? "--" : `${investments.length}`}
          </p>
          <p className="text-[10px] text-muted mt-2">Total kategori aset yang terdaftar</p>
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
              {investments.map((inv) => {
                const assetColor = TYPE_COLORS[inv.type];
                
                return (
                  <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-card-hover/20 transition-colors group">
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
                          <span className="font-medium text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-card-border/50 border border-card-border">
                            {TYPE_LABELS[inv.type]}
                          </span>
                          {inv.notes && <span className="truncate max-w-[120px] sm:max-w-none">{inv.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pl-13 sm:pl-0">
                      {/* Current Value */}
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-foreground">{formatRupiah(inv.current_val)}</p>
                        <p className="text-[10px] text-muted mt-0.5">Nilai Terakhir</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingAsset(inv)}
                          className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors cursor-pointer"
                          title="Ubah Nilai / Detail Aset"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus aset "${inv.name}"? Data aset ini akan terhapus permanen.`)) {
                              deleteInvestment(inv.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-expense/10 text-muted hover:text-expense transition-colors cursor-pointer"
                          title="Hapus Aset"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
                <div className="w-full h-[180px]">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val) => formatRupiah(Number(val))}
                          contentStyle={{ background: "#0f172a", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "8px", color: "#f8fafc" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted truncate min-w-0">{item.name}</span>
                      <span className="font-semibold text-foreground shrink-0">
                        {((item.value / totalCurrent) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
          investment={editingAsset}
          onSubmit={handleUpdateInvestmentAsset}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
}
