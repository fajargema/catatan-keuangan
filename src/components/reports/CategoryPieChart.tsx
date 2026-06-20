"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronDown } from "lucide-react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

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

      {/* Legend — klik baris untuk lihat rincian per sumber dana */}
      <div className="space-y-1 mt-4">
        {data.map((item) => {
          const isOpen = expanded === item.name;
          const hasMultiSource = item.sources.length > 1;
          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : item.name)}
                aria-expanded={isOpen}
                className="focus-ring w-full flex items-center justify-between text-sm py-1.5 rounded-lg hover:bg-card-hover/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground/80 truncate">
                    {item.icon} {item.name}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-muted shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-muted">{item.percentage.toFixed(1)}%</span>
                  <span className="font-medium" style={{ color: item.color }}>
                    {formatRupiah(item.total)}
                  </span>
                </div>
              </button>

              {/* Rincian per sumber */}
              {isOpen && (
                <div className="ml-5 mt-1 mb-2 pl-3 border-l border-card-border space-y-1.5 animate-fade-in">
                  {item.sources.map((src) => {
                    const pct =
                      item.total > 0 ? (src.total / item.total) * 100 : 0;
                    return (
                      <div
                        key={src.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-1.5 text-muted min-w-0 truncate">
                          <span>{src.icon}</span>
                          <span className="truncate">{src.name}</span>
                          {hasMultiSource && (
                            <span className="text-[10px] opacity-70">
                              {pct.toFixed(0)}%
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-foreground/70 tabular-nums shrink-0">
                          {formatRupiah(src.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
