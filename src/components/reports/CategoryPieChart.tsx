"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryReport } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

interface CategoryPieChartProps {
  data: CategoryReport[];
  title: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: CategoryReport;
  }>;
}) {
  if (!active || !payload || !payload[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="glass-card p-3 !border-card-border text-sm">
      <p className="font-medium">
        {item.icon} {item.name}
      </p>
      <p style={{ color: item.color }}>{formatRupiah(item.total)}</p>
      <p className="text-muted">{item.percentage.toFixed(1)}%</p>
    </div>
  );
}

export default function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">
          {title}
        </h3>
        <div className="empty-state py-12">
          <p className="text-sm text-muted">Belum ada data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in delay-2">
      <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="total"
              nameKey="name"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground/80">
                {item.icon} {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted">{item.percentage.toFixed(1)}%</span>
              <span className="font-medium" style={{ color: item.color }}>
                {formatRupiah(item.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
