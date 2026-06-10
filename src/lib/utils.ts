import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahInput(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  return formatRupiah(parseInt(clean, 10));
}


export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMM", { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    const date = parseISO(dateStr + "-01");
    return format(date, "MMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

export function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Bulan berjalan dalam format "YYYY-MM". */
export function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Rentang tanggal satu bulan penuh: "YYYY-MM" → { startDate, endDate }. */
export function getMonthRange(yearMonth: string): {
  startDate: string;
  endDate: string;
} {
  const [y, m] = yearMonth.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    startDate: `${y}-${mm}-01`,
    endDate: `${y}-${mm}-${String(days).padStart(2, "0")}`,
  };
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const WALLET_ICONS = [
  "💰", "🏦", "💳", "📱", "💵", "🪙", "💎", "🏧",
];

export const WALLET_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#64748b",
];
