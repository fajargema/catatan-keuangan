"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import type { MonthlyReport } from "@/lib/types";
import { formatRupiah, formatMonthYear, formatDateShort } from "@/lib/utils";

interface MonthlyTrendChartProps {
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
    <div className="glass-card p-3 !border-card-border text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} style={{ color: item.color }}>
          {item.name}: {formatRupiah(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function MonthlyTrendChart({
  data,
  granularity = "month",
}: MonthlyTrendChartProps) {
  const formatLabel = granularity === "day" ? formatDateShort : formatMonthYear;
  const title = granularity === "day" ? "Tren Harian" : "Tren Bulanan";
  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatLabel(d.month),
    net: d.income - d.expense,
  }));

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="section-label mb-4">{title}</p>
        <div className="empty-state py-12">
          <p className="text-sm text-muted">Belum ada data untuk ditampilkan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in delay-3">
      <p className="section-label mb-5">{title}</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
                v >= 1000000
                  ? `${(v / 1000000).toFixed(0)}jt`
                  : v >= 1000
                  ? `${(v / 1000).toFixed(0)}rb`
                  : `${v}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8, fontFamily: "var(--font-sans)" }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Pemasukan"
              stroke="var(--color-income)"
              fill="url(#incomeGrad)"
              strokeWidth={2}
              dot={{ fill: "var(--color-income)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Pengeluaran"
              stroke="var(--color-expense)"
              fill="url(#expenseGrad)"
              strokeWidth={2}
              dot={{ fill: "var(--color-expense)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
