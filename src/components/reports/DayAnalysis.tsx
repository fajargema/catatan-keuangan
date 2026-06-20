"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { parseISO, getDay } from "date-fns";
import { CalendarRange, Flame } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types";

interface DayAnalysisProps {
  transactions: TransactionWithRelations[];
}

// Urutan tampilan Senin → Minggu. Index = hasil getDay() (0=Minggu).
const DAYS = [
  { key: 1, short: "Sen", weekend: false },
  { key: 2, short: "Sel", weekend: false },
  { key: 3, short: "Rab", weekend: false },
  { key: 4, short: "Kam", weekend: false },
  { key: 5, short: "Jum", weekend: false },
  { key: 6, short: "Sab", weekend: true },
  { key: 0, short: "Min", weekend: true },
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { short: string; total: number } }>;
}) {
  if (!active || !payload || !payload[0]) return null;
  const item = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--modal-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: 12,
        padding: "10px 14px",
        backdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-float)",
        fontSize: 13,
      }}
    >
      <p className="font-semibold" style={{ color: "var(--text-primary)", fontSize: 12 }}>
        {item.short}
      </p>
      <p style={{ color: "var(--color-expense)", fontWeight: 600, fontSize: 12 }}>
        {formatRupiah(item.total)}
      </p>
    </div>
  );
}

export default function DayAnalysis({ transactions }: DayAnalysisProps) {
  const { chartData, busiest, weekdayTotal, weekendTotal, hasData } = useMemo(() => {
    const totals: Record<number, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const d = getDay(parseISO(t.date));
        totals[d] = (totals[d] || 0) + t.amount;
      });

    const chartData = DAYS.map((d) => ({
      short: d.short,
      total: totals[d.key] || 0,
      weekend: d.weekend,
    }));

    const busiest = chartData.reduce((max, d) =>
      d.total > max.total ? d : max
    );

    const weekdayTotal = chartData
      .filter((d) => !d.weekend)
      .reduce((s, d) => s + d.total, 0);
    const weekendTotal = chartData
      .filter((d) => d.weekend)
      .reduce((s, d) => s + d.total, 0);

    return {
      chartData,
      busiest,
      weekdayTotal,
      weekendTotal,
      hasData: busiest.total > 0,
    };
  }, [transactions]);

  const grandTotal = weekdayTotal + weekendTotal;
  const weekendPct = grandTotal > 0 ? (weekendTotal / grandTotal) * 100 : 0;
  // Rata-rata harian: weekday dibagi 5 hari, weekend dibagi 2 hari.
  const weekdayAvg = weekdayTotal / 5;
  const weekendAvg = weekendTotal / 2;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <CalendarRange size={16} className="text-accent-blue" />
        <h2 className="text-base font-bold">Pola Pengeluaran per Hari</h2>
      </div>
      <p className="text-[11px] text-muted mb-5">
        Total pengeluaran dikelompokkan berdasarkan hari dalam seminggu
      </p>

      {!hasData ? (
        <div className="empty-state py-10">
          <p className="text-sm text-muted">Belum ada pengeluaran untuk dianalisis</p>
        </div>
      ) : (
        <>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis
                  dataKey="short"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-sans)" }}
                  axisLine={{ stroke: "var(--divider)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-sans)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(0)}jt`
                      : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}rb`
                      : `${v}`
                  }
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--glass-bg)" }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {chartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.short === busiest.short
                          ? "var(--color-expense)"
                          : d.weekend
                          ? "var(--accent-amber, #f97316)"
                          : "var(--accent-blue)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="p-3.5 rounded-xl border border-card-border bg-card-hover/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={13} className="text-expense" />
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                  Hari Paling Boros
                </p>
              </div>
              <p className="text-sm font-bold text-expense">{busiest.short}</p>
              <p className="text-[11px] text-muted tabular-nums">
                {formatRupiah(busiest.total)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-card-border bg-card-hover/20">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                Rata-rata Hari Kerja
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
                {formatRupiah(weekdayAvg)}
              </p>
              <p className="text-[11px] text-muted">per hari (Sen–Jum)</p>
            </div>

            <div className="p-3.5 rounded-xl border border-card-border bg-card-hover/20">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                Rata-rata Akhir Pekan
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "#f97316" }}>
                {formatRupiah(weekendAvg)}
              </p>
              <p className="text-[11px] text-muted">
                {weekendPct.toFixed(0)}% dari total · Sab–Min
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
