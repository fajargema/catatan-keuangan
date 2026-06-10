"use client";

import { Pencil, Trash2, Lock } from "lucide-react";
import type { Source } from "@/lib/types";

interface SourceCardProps {
  source: Source;
  onEdit: (source: Source) => void;
  onDelete: (id: string) => void;
}

export default function SourceCard({ source, onEdit, onDelete }: SourceCardProps) {
  // Global seeds (user_id null) cannot be edited/deleted
  const isGlobal = !source.user_id;

  return (
    <div className="glass-card p-5 group animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: source.color + "20" }}
          >
            {source.icon}
          </span>
          <div>
            <h3 className="font-semibold text-foreground">{source.name}</h3>
            <p className="text-xs text-muted mt-0.5">
              {isGlobal ? (
                <span className="flex items-center gap-1">
                  <Lock size={10} />
                  Default
                </span>
              ) : (
                "Custom"
              )}
            </p>
          </div>
        </div>

        {!isGlobal && (
          <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(source)}
              className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted hover:text-foreground"
              aria-label="Edit sumber"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(source.id)}
              className="p-2 rounded-lg hover:bg-expense/10 transition-colors text-muted hover:text-expense"
              aria-label="Hapus sumber"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Color accent bar */}
      <div
        className="mt-4 h-1 rounded-full opacity-40"
        style={{ backgroundColor: source.color }}
      />
    </div>
  );
}
