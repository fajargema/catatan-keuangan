"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyReport } from "@/lib/types";
import { formatRupiah, formatMonthYear, formatDateShort } from "@/lib/utils";

interface IncomeExpenseChartProps {
  data: MonthlyReport[];
  /** "day" saat mode Bulan Ini (key data "YYYY-MM-DD"), default "month" */
  granularity?: "day" | "month";
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
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
      <p
        className="font-semibold mb-2"
        style={{ color: "var(--text-primary)", fontSize: 12 }}
      >
        {label}
      </p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2 mb-1">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
            {item.name}:
          </span>
          <span style={{ color: item.color, fontWeight: 600, fontSize: 12 }}>
            {formatRupiah(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IncomeExpenseChart({
  data,
  granularity = "month",
}: IncomeExpenseChartProps) {
  const formatLabel = granularity === "day" ? formatDateShort : formatMonthYear;
  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatLabel(d.month),
  }));

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="section-label mb-4">Pemasukan vs Pengeluaran</p>
        <div className="empty-state py-10">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Belum ada data untuk ditampilkan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      <p className="section-label mb-5">Pemasukan vs Pengeluaran</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={chartData} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--divider)"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-sans)" }}
              axisLine={{ stroke: "var(--divider)" }}
              tickLine={false}
              minTickGap={16}
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
            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 12,
                fontFamily: "var(--font-sans)",
                color: "var(--text-secondary)",
              }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="income"
              name="Pemasukan"
              fill="var(--color-income)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="expense"
              name="Pengeluaran"
              fill="var(--color-expense)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
