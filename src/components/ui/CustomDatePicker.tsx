"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const WEEK_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CustomDatePicker({
  value,
  onChange,
  id,
  className,
  placeholder = "Pilih tanggal...",
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current year/month from value, fallback to today
  const initialDate = useMemo(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  // Bulan yang ditampilkan kalender diturunkan saat render: override navigasi
  // hanya berlaku untuk kombinasi value+sesi-buka saat ini, sehingga tampilan
  // otomatis kembali ke bulan tanggal terpilih saat value berubah dari luar
  // atau picker dibuka ulang — tanpa effect.
  const viewKey = `${value}|${isOpen}`;
  const [viewOverride, setViewOverride] = useState<{
    key: string;
    year: number;
    month: number;
  } | null>(null);
  const isOverrideActive = viewOverride?.key === viewKey;
  const currentYear = isOverrideActive ? viewOverride.year : initialDate.getFullYear();
  const currentMonth = isOverrideActive ? viewOverride.month : initialDate.getMonth();

  // Click outside to close calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format YYYY-MM-DD into a user-friendly Indonesian format (e.g. 03 Jun 2026)
  const formattedDisplayDate = useMemo(() => {
    if (!value) return "";
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }, [value]);

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; day: number; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }[] = [];

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYearIdx}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;

      cells.push({
        dateStr,
        day: prevDay,
        isCurrentMonth: false,
        isSelected: value === dateStr,
        isToday: todayStr === dateStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      cells.push({
        dateStr,
        day: d,
        isCurrentMonth: true,
        isSelected: value === dateStr,
        isToday: todayStr === dateStr,
      });
    }

    // Next month padding days to fill 42 cells grid (6 rows * 7 days)
    const remainingCells = 42 - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYearIdx}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      cells.push({
        dateStr,
        day: d,
        isCurrentMonth: false,
        isSelected: value === dateStr,
        isToday: todayStr === dateStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth, value]);

  const handlePrevMonth = () => {
    setViewOverride({
      key: viewKey,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
    });
  };

  const handleNextMonth = () => {
    setViewOverride({
      key: viewKey,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
    });
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectQuick = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    handleSelectDate(dateStr);
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input flex items-center justify-between cursor-pointer text-sm h-[42px] gap-2 w-full text-left"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-muted" />
          {value ? (
            <span style={{ color: "var(--text-primary)" }}>{formattedDisplayDate}</span>
          ) : (
            <span style={{ color: "var(--text-tertiary)" }}>{placeholder}</span>
          )}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 w-[280px] sm:w-[290px] rounded-xl bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-card-border shadow-lg z-50 p-3 animate-scale-in select-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-[var(--divider)] text-muted hover:text-foreground transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-[var(--divider)] text-muted hover:text-foreground transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((day) => (
              <span key={day} className="text-[10px] font-bold text-muted uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDate(cell.dateStr)}
                className={cn(
                  "h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                  !cell.isCurrentMonth && "opacity-30",
                  cell.isCurrentMonth && "text-[var(--text-primary)]",
                  cell.isSelected && "shadow-sm",
                  !cell.isSelected && "hover:bg-accent/10 hover:text-accent",
                  cell.isToday && !cell.isSelected && "border border-accent"
                )}
                style={
                  cell.isSelected
                    ? {
                        background: "var(--accent-primary)",
                        color: "var(--on-accent)",
                      }
                    : cell.isToday
                    ? {
                        borderColor: "var(--accent-primary)",
                      }
                    : {}
                }
              >
                {cell.day}
              </button>
            ))}
          </div>

          {/* Quick select buttons */}
          <div className="flex gap-2 mt-3 pt-2.5 border-t border-[var(--divider)]">
            <button
              type="button"
              onClick={() => handleSelectQuick(0)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-[var(--divider)] transition-all flex-1 text-center"
              style={{
                background: "var(--glass-bg-hover)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick(-1)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-[var(--divider)] transition-all flex-1 text-center"
              style={{
                background: "var(--glass-bg-hover)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              Kemarin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
