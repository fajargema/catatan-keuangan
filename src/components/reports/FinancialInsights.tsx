"use client";

import { useMemo } from "react";
import type { TransactionWithRelations } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  Heart
} from "lucide-react";

interface FinancialInsightsProps {
  transactions: TransactionWithRelations[];
  loading?: boolean;
}

export default function FinancialInsights({ transactions, loading }: FinancialInsightsProps) {
  
  // Calculate dynamic insights based on transactions
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    // 1. Totals
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      if (t.type === "expense") totalExpense += t.amount;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // 2. Health Status
    let healthStatus = "warning"; // danger, warning, good, excellent
    let healthLabel = "Waspada";
    let healthColor = "var(--accent-cyan)";
    let healthBg = "rgba(6, 182, 212, 0.08)";
    let healthBorder = "rgba(6, 182, 212, 0.25)";
    let healthText = "Rasio tabungan Anda sangat rendah. Anda rentan jika terjadi pengeluaran darurat. Segera tinjau pos pengeluaran.";

    if (totalIncome === 0 && totalExpense > 0) {
      healthStatus = "danger";
      healthLabel = "Defisit Total";
      healthColor = "var(--color-expense)";
      healthBg = "var(--color-expense-dim)";
      healthBorder = "rgba(244, 63, 94, 0.25)";
      healthText = "Pengeluaran terdeteksi tanpa adanya pemasukan dicatat. Anda membelanjakan uang tabungan atau berutang.";
    } else if (savingsRate < 0) {
      healthStatus = "danger";
      healthLabel = "Defisit Keuangan";
      healthColor = "var(--color-expense)";
      healthBg = "var(--color-expense-dim)";
      healthBorder = "rgba(244, 63, 94, 0.25)";
      healthText = `Bahaya! Pengeluaran melebihi pemasukan (Defisit ${formatRupiah(Math.abs(netSavings))}). Segera rem pengeluaran non-esensial!`;
    } else if (savingsRate >= 30) {
      healthStatus = "excellent";
      healthLabel = "Sangat Sehat";
      healthColor = "var(--accent-emerald)";
      healthBg = "var(--accent-emerald-dim)";
      healthBorder = "rgba(16, 185, 129, 0.25)";
      healthText = `Luar biasa! Rasio tabungan Anda ${savingsRate.toFixed(0)}%, di atas batas ideal 30%. Pertahankan disiplin keuangan Anda!`;
    } else if (savingsRate >= 10) {
      healthStatus = "good";
      healthLabel = "Cukup Sehat";
      healthColor = "var(--accent-indigo)";
      healthBg = "var(--accent-indigo-dim)";
      healthBorder = "rgba(99, 102, 241, 0.25)";
      healthText = `Cukup baik. Rasio tabungan Anda ${savingsRate.toFixed(0)}%. Coba pangkas beberapa pengeluaran keinginan untuk menyentuh target ideal 30%.`;
    }

    // 3. Category Breakdown
    const expenseCategories: Record<string, { total: number; icon: string; color: string }> = {};
    transactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const cat = t.category!;
        if (!expenseCategories[cat.name]) {
          expenseCategories[cat.name] = { total: 0, icon: cat.icon, color: cat.color };
        }
        expenseCategories[cat.name].total += t.amount;
      });

    let topCategory = null;
    let topCategoryTotal = 0;
    let topCategoryPct = 0;

    Object.entries(expenseCategories).forEach(([name, data]) => {
      if (data.total > topCategoryTotal) {
        topCategoryTotal = data.total;
        topCategory = { name, ...data };
      }
    });

    if (topCategory && totalExpense > 0) {
      topCategoryPct = (topCategoryTotal / totalExpense) * 100;
    }

    // Advice mapper based on category name
    const getCategoryTip = (name: string) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes("makan") || lowerName.includes("kuliner") || lowerName.includes("food")) {
        return "Pengeluaran makan tinggi terdeteksi. Pertimbangkan untuk memasak di rumah, membawa bekal, dan membatasi frekuensi pesan antar makanan.";
      }
      if (lowerName.includes("belanja") || lowerName.includes("shopping") || lowerName.includes("mall")) {
        return "Pengeluaran belanja tinggi. Gunakan 'aturan 24 jam' sebelum membeli barang non-kebutuhan untuk meredam nafsu belanja impulsif.";
      }
      if (lowerName.includes("transport") || lowerName.includes("bensin") || lowerName.includes("ojek")) {
        return "Pengeluaran perjalanan tinggi. Coba gabungkan rute bepergian, gunakan transportasi publik, atau manfaatkan promo ojek online.";
      }
      if (lowerName.includes("hiburan") || lowerName.includes("nonton") || lowerName.includes("game")) {
        return "Biaya rekreasi cukup tinggi. Cari alternatif hiburan bebas biaya seperti berolahraga di taman kota atau melakukan hobi rumahan.";
      }
      if (lowerName.includes("tagihan") || lowerName.includes("utilitas") || lowerName.includes("langganan")) {
        return "Periksa kembali layanan berlangganan (streaming/musik) yang jarang Anda gunakan. Berhenti berlangganan sementara dapat menghemat saldo.";
      }
      if (lowerName.includes("investasi") || lowerName.includes("saham") || lowerName.includes("emas")) {
        return "Sangat bagus! Investasi adalah cara terbaik untuk melipatgandakan aset. Pastikan jumlahnya seimbang dengan alokasi dana darurat.";
      }
      return "Pos ini mendominasi pengeluaran Anda. Lakukan pelacakan secara harian untuk memastikan pengeluaran tidak melebihi anggaran.";
    };

    // 4. Monthly comparison (trend)
    const monthlyMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const m = t.date.substring(0, 7); // "YYYY-MM"
        monthlyMap[m] = (monthlyMap[m] || 0) + t.amount;
      });

    const sortedMonths = Object.keys(monthlyMap).sort();
    let trendText = "Gunakan aturan penganggaran 50/30/20 (50% kebutuhan pokok, 30% keinginan, 20% tabungan) untuk menstabilkan struktur keuangan Anda.";
    let trendDirection: "up" | "down" | "none" = "none";
    let trendPct = 0;

    if (sortedMonths.length >= 2) {
      const currentMonthStr = sortedMonths[sortedMonths.length - 1];
      const prevMonthStr = sortedMonths[sortedMonths.length - 2];
      const curExp = monthlyMap[currentMonthStr];
      const prevExp = monthlyMap[prevMonthStr];

      if (prevExp > 0) {
        trendPct = Math.abs(((curExp - prevExp) / prevExp) * 100);
        if (curExp > prevExp) {
          trendDirection = "up";
          trendText = `Pengeluaran Anda bulan terakhir meningkat sebesar ${trendPct.toFixed(0)}% dibanding bulan sebelumnya. Waktunya mengevaluasi dan merem belanja!`;
        } else if (curExp < prevExp) {
          trendDirection = "down";
          trendText = `Hebat! Pengeluaran bulan terakhir Anda menurun sebesar ${trendPct.toFixed(0)}% dibanding bulan sebelumnya. Pertahankan efisiensi ini!`;
        } else {
          trendText = "Total pengeluaran Anda bulan terakhir stabil dan persis sama dengan bulan sebelumnya.";
        }
      }
    }

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      healthLabel,
      healthColor,
      healthBg,
      healthBorder,
      healthText,
      healthStatus,
      topCategory: topCategory ? {
        name: (topCategory as any).name,
        icon: (topCategory as any).icon,
        color: (topCategory as any).color,
        total: topCategoryTotal,
        pct: topCategoryPct,
        tip: getCategoryTip((topCategory as any).name),
      } : null,
      trendText,
      trendDirection,
      trendPct,
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-5">
          <div className="skeleton w-6 h-6 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-card-border/50 space-y-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3.5 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <BrainCircuit size={16} className="text-accent animate-pulse" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Analisis Keuangan Cerdas</h2>
        </div>
        <div className="empty-state py-8">
          <p className="text-xs text-muted">Mulai mencatat transaksi Anda untuk melihat wawasan dan saran keuangan di sini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in relative overflow-hidden group">
      {/* Background soft glow */}
      <div className="absolute -right-16 -top-16 w-44 h-44 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/8 transition-colors duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <BrainCircuit size={16} className="text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Financial Insights</h2>
          <p className="text-[10px] text-muted">Rekomendasi keuangan otomatis berbasis data pencatatan Anda</p>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Card 1: Health Status */}
        <div 
          className="p-4 rounded-xl border hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          style={{ 
            backgroundColor: insights.healthBg,
            borderColor: insights.healthBorder
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Kesehatan Tabungan</span>
              {insights.healthStatus === "excellent" && <ShieldCheck size={16} style={{ color: insights.healthColor }} />}
              {insights.healthStatus === "good" && <Activity size={16} style={{ color: insights.healthColor }} />}
              {insights.healthStatus === "warning" && <AlertTriangle size={16} style={{ color: insights.healthColor }} />}
              {insights.healthStatus === "danger" && <AlertTriangle size={16} style={{ color: insights.healthColor }} />}
            </div>
            <p className="text-lg font-bold" style={{ color: insights.healthColor }}>
              {insights.healthLabel}
            </p>
            <p className="text-xs font-semibold mt-0.5 text-foreground">
              Rasio Tabungan: {insights.savingsRate.toFixed(0)}%
            </p>

            {/* Progress Bar */}
            {insights.savingsRate > 0 && (
              <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.min(insights.savingsRate, 100)}%`,
                    backgroundColor: insights.healthColor
                  }}
                />
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted mt-4 leading-relaxed">
            {insights.healthText}
          </p>
        </div>

        {/* Card 2: Top Expense Category */}
        <div className="p-4 rounded-xl border border-card-border bg-card-hover/20 hover:border-card-border-hover hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Fokus Pengeluaran</span>
              <Heart size={15} className="text-accent" />
            </div>
            {insights.topCategory ? (
              <>
                <p className="text-lg font-bold text-foreground truncate">
                  {insights.topCategory.icon} {insights.topCategory.name}
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: insights.topCategory.color }}>
                  {formatRupiah(insights.topCategory.total)} ({insights.topCategory.pct.toFixed(0)}%)
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(insights.topCategory.pct, 100)}%`,
                      backgroundColor: insights.topCategory.color
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-foreground">Tidak Ada Beban</p>
                <p className="text-xs font-semibold mt-0.5 text-muted">Rp 0 (0%)</p>
              </>
            )}
          </div>
          
          <p className="text-xs text-muted mt-4 leading-relaxed">
            {insights.topCategory ? insights.topCategory.tip : "Belum ada transaksi pengeluaran bulan ini. Saldo Anda masih utuh sepenuhnya!"}
          </p>
        </div>

        {/* Card 3: Trend or Budget Rule */}
        <div className="p-4 rounded-xl border border-card-border bg-card-hover/20 hover:border-card-border-hover hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Analisis Tren</span>
              {insights.trendDirection === "up" && <TrendingUp size={16} className="text-expense" />}
              {insights.trendDirection === "down" && <TrendingDown size={16} className="text-income" />}
              {insights.trendDirection === "none" && <Activity size={16} className="text-muted" />}
            </div>
            <p className="text-lg font-bold text-foreground">
              {insights.trendDirection === "up" && "Pengeluaran Naik"}
              {insights.trendDirection === "down" && "Pengeluaran Turun"}
              {insights.trendDirection === "none" && "Struktur Keuangan"}
            </p>

            {/* Dynamic Trend Badge */}
            {insights.trendDirection !== "none" ? (
              <div className="mt-2 flex items-center gap-1.5">
                <span 
                  className="badge font-bold px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    backgroundColor: insights.trendDirection === "up" ? "var(--color-expense-dim)" : "var(--color-income-dim)",
                    color: insights.trendDirection === "up" ? "var(--color-expense)" : "var(--color-income)",
                    border: insights.trendDirection === "up" ? "1px solid rgba(244,63,94,0.2)" : "1px solid rgba(16,185,129,0.2)"
                  }}
                >
                  {insights.trendDirection === "up" ? "+" : "-"}{insights.trendPct.toFixed(0)}%
                </span>
                <span className="text-[10px] text-muted font-medium">dari bulan lalu</span>
              </div>
            ) : (
              <p className="text-xs font-semibold mt-0.5 text-muted">Aturan Budgeting 50/30/20</p>
            )}
          </div>
          
          <p className="text-xs text-muted mt-4 leading-relaxed">
            {insights.trendText}
          </p>
        </div>
      </div>
    </div>
  );
}
