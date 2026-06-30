"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import type { InvestmentSnapshot } from "@/lib/types";
import { formatRupiah, formatMonthYear } from "@/lib/utils";

interface PortfolioGrowthChartProps {
  snapshots: InvestmentSnapshot[];
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
        <p key={index} style={{ color: item.color }} className="tabular-nums">
          {item.name}: {formatRupiah(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function PortfolioGrowthChart({ snapshots }: PortfolioGrowthChartProps) {
  const chartData = snapshots.map((s) => ({
    label: formatMonthYear(s.period),
    value: s.total_value,
    cost: s.total_cost,
  }));

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <p className="section-label">Pertumbuhan Portofolio</p>
        <span className="text-[11px] text-muted">{snapshots.length} bulan tercatat</span>
      </div>
      <p className="text-xs text-muted mb-5">Riwayat nilai & modal portofolio per bulan</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="portfolioValueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-indigo)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--accent-indigo)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
            <XAxis
              dataKey="label"
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
              dataKey="value"
              name="Nilai"
              stroke="var(--accent-indigo)"
              fill="url(#portfolioValueGrad)"
              strokeWidth={2.5}
              dot={{ fill: "var(--accent-indigo)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              name="Modal"
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
