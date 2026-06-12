import { useMemo } from "react";
import type { Wallet, Category, Source } from "@/lib/types";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, LayoutGrid } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

interface TransactionFilterProps {
  type: "" | "income" | "expense";
  walletId: string;
  categoryId: string;
  sourceId: string;
  selectedMonth: string;
  wallets: Wallet[];
  categories: Category[];
  sources: Source[];
  onTypeChange: (type: "" | "income" | "expense") => void;
  onWalletChange: (walletId: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSourceChange: (sourceId: string) => void;
  onMonthChange: (month: string) => void;
}

export default function TransactionFilter({
  type,
  walletId,
  categoryId,
  sourceId,
  selectedMonth,
  wallets,
  categories,
  sources,
  onTypeChange,
  onWalletChange,
  onCategoryChange,
  onSourceChange,
  onMonthChange,
}: TransactionFilterProps) {
  const filteredCategories = type
    ? categories.filter((c) => c.type === type)
    : categories;

  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: w.name,
    icon: w.icon,
  }));

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: c.icon,
  }));

  const sourceOptions = sources.map((s) => ({
    value: s.id,
    label: s.name,
    icon: s.icon,
  }));

  const displayMonthName = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    onMonthChange(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    onMonthChange(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="glass-card p-4 animate-scale-in space-y-4 relative z-30">
      {/* ── Row 1: Month + Type ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Month Navigator */}
        <div
          className="flex items-center gap-1 rounded-xl p-1 shrink-0 self-start sm:self-auto"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
          }}
        >
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg transition-all text-muted hover:text-foreground hover:bg-card-hover"
            type="button"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs sm:text-sm font-semibold px-2 min-w-[110px] sm:min-w-[130px] text-center select-none text-foreground">
            {displayMonthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg transition-all text-muted hover:text-foreground hover:bg-card-hover"
            type="button"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Type Pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onTypeChange("")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: !type ? "var(--accent-primary-dim)" : "var(--glass-bg)",
              color: !type ? "var(--accent-primary)" : "var(--text-secondary)",
              borderColor: !type ? "color-mix(in srgb, var(--accent-primary) 32%, transparent)" : "var(--glass-border)",
            }}
          >
            <LayoutGrid size={12} />
            Semua
          </button>
          <button
            onClick={() => onTypeChange("income")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: type === "income" ? "var(--color-income-dim)" : "var(--glass-bg)",
              color: type === "income" ? "var(--color-income)" : "var(--text-secondary)",
              borderColor: type === "income" ? "color-mix(in srgb, var(--color-income) 32%, transparent)" : "var(--glass-border)",
            }}
          >
            <TrendingUp size={12} />
            Pemasukan
          </button>
          <button
            onClick={() => onTypeChange("expense")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: type === "expense" ? "var(--color-expense-dim)" : "var(--glass-bg)",
              color: type === "expense" ? "var(--color-expense)" : "var(--text-secondary)",
              borderColor: type === "expense" ? "rgba(244,63,94,0.3)" : "var(--glass-border)",
            }}
          >
            <TrendingDown size={12} />
            Pengeluaran
          </button>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────── */}
      <div style={{ height: 1, background: "var(--divider)" }} />

      {/* ── Row 2: Dropdowns ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <CustomSelect
          value={sourceId}
          onChange={onSourceChange}
          options={sourceOptions}
          placeholder="Semua Sumber"
          id="filter-source-dropdown"
        />
        <CustomSelect
          value={categoryId}
          onChange={onCategoryChange}
          options={categoryOptions}
          placeholder="Semua Kategori"
          id="filter-category-dropdown"
        />
        <CustomSelect
          value={walletId}
          onChange={onWalletChange}
          options={walletOptions}
          placeholder="Semua Dompet"
          id="filter-wallet-dropdown"
        />
      </div>
    </div>
  );
}
