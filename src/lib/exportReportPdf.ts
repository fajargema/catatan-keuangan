import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { parseISO, getDay, format } from "date-fns";
import type {
  TransactionWithRelations,
  CategoryReport,
  Source,
} from "@/lib/types";

export interface ReportExportData {
  periodLabel: string;
  comparedTo: string;
  periodDays: number;
  transactions: TransactionWithRelations[];
  prevTransactions: TransactionWithRelations[];
  expenseCategories: CategoryReport[];
  incomeCategories: CategoryReport[];
  sourceBreakdown: { source: Source; income: number; expense: number }[];
  userName?: string;
}

// Palet warna PDF (RGB) — selaras dengan tema aplikasi
const C = {
  accent: [99, 102, 241] as [number, number, number], // indigo
  income: [16, 185, 129] as [number, number, number], // emerald
  expense: [244, 63, 94] as [number, number, number], // rose
  ink: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
};

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  0: "Minggu",
};

function sumByType(txs: TransactionWithRelations[]) {
  let income = 0;
  let expense = 0;
  txs.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });
  return { income, expense, savings: income - expense };
}

function pct(cur: number, prev: number): string {
  if (prev === 0) return "—";
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return `${d > 0 ? "+" : ""}${d.toFixed(0)}%`;
}

function lastY(doc: jsPDF, fallback: number): number {
  const t = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return t ? t.finalY : fallback;
}

export function exportReportPdf(data: ReportExportData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header band ─────────────────────────────────────
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Keuangan", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const genAt = `Dicetak ${format(new Date(), "dd MMM yyyy HH:mm")}`;
  doc.text(
    `${data.periodLabel}${data.userName ? `  •  ${data.userName}` : ""}`,
    margin,
    22
  );
  doc.text(genAt, pageW - margin, 22, { align: "right" });

  // ── Ringkasan & Perbandingan ────────────────────────
  const cur = sumByType(data.transactions);
  const prev = sumByType(data.prevTransactions);

  autoTable(doc, {
    startY: 38,
    head: [["Ringkasan", "Periode Ini", "Sebelumnya", data.comparedTo]],
    body: [
      ["Total Pemasukan", rp(cur.income), rp(prev.income), pct(cur.income, prev.income)],
      ["Total Pengeluaran", rp(cur.expense), rp(prev.expense), pct(cur.expense, prev.expense)],
      ["Tabungan Bersih", rp(cur.savings), rp(prev.savings), pct(cur.savings, prev.savings)],
    ],
    theme: "striped",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9.5, cellPadding: 2.5, textColor: C.ink, lineColor: C.line },
    headStyles: { fillColor: C.accent, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.zebra },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right", textColor: C.muted },
      3: { halign: "right" },
    },
  });

  // ── Statistik Ringkas ───────────────────────────────
  const expenses = data.transactions.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const biggest = expenses.reduce<TransactionWithRelations | null>(
    (m, t) => (!m || t.amount > m.amount ? t : m),
    null
  );
  const perDayMap: Record<string, number> = {};
  expenses.forEach((t) => {
    perDayMap[t.date] = (perDayMap[t.date] || 0) + t.amount;
  });
  let topDay: { date: string; total: number } | null = null;
  for (const [date, total] of Object.entries(perDayMap)) {
    if (!topDay || total > topDay.total) topDay = { date, total };
  }

  autoTable(doc, {
    startY: lastY(doc, 38) + 6,
    head: [["Statistik", "Nilai"]],
    body: [
      ["Jumlah Transaksi", `${data.transactions.length}`],
      ["Rata-rata Pengeluaran / Hari", rp(totalExpense / Math.max(data.periodDays, 1))],
      ["Rata-rata per Transaksi", rp(expenses.length ? totalExpense / expenses.length : 0)],
      [
        "Transaksi Terbesar",
        biggest ? `${rp(biggest.amount)} — ${biggest.category?.name ?? biggest.description ?? "-"}` : "—",
      ],
      [
        "Hari Paling Boros",
        topDay ? `${format(parseISO(topDay.date), "dd MMM yyyy")} (${rp(topDay.total)})` : "—",
      ],
    ],
    theme: "striped",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9.5, cellPadding: 2.5, textColor: C.ink, lineColor: C.line },
    headStyles: { fillColor: C.ink, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.zebra },
    columnStyles: { 1: { halign: "right" } },
  });

  // ── Distribusi kategori (pengeluaran & pemasukan) ───
  const catTable = (title: string, rows: CategoryReport[], tint: [number, number, number]) => {
    if (rows.length === 0) return;
    autoTable(doc, {
      startY: lastY(doc, 38) + 6,
      head: [[title, "Nominal", "%", "Sumber Utama"]],
      body: rows.map((c) => [
        c.name,
        rp(c.total),
        `${c.percentage.toFixed(1)}%`,
        c.sources.map((s) => `${s.name} (${rp(s.total)})`).join(", "),
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: C.ink, lineColor: C.line, valign: "middle" },
      headStyles: { fillColor: tint, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold", cellWidth: 28 },
        2: { halign: "right", cellWidth: 16, textColor: C.muted },
        3: { fontSize: 8, textColor: C.muted },
      },
    });
  };
  catTable("Distribusi Pengeluaran", data.expenseCategories, C.expense);
  catTable("Distribusi Pemasukan", data.incomeCategories, C.income);

  // ── Transaksi Terbesar (top 5 masing-masing) ────────
  const topExp = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const topInc = [...data.transactions.filter((t) => t.type === "income")]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (topExp.length || topInc.length) {
    autoTable(doc, {
      startY: lastY(doc, 38) + 6,
      head: [["#", "Pengeluaran Terbesar", "Nominal", "Tanggal"]],
      body: topExp.map((t, i) => [
        `${i + 1}`,
        t.description || t.category?.name || "-",
        rp(t.amount),
        format(parseISO(t.date), "dd MMM"),
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: C.ink, lineColor: C.line },
      headStyles: { fillColor: C.expense, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", textColor: C.muted },
        2: { halign: "right", fontStyle: "bold", cellWidth: 30 },
        3: { halign: "right", cellWidth: 20, textColor: C.muted },
      },
    });

    autoTable(doc, {
      startY: lastY(doc, 38) + 4,
      head: [["#", "Pemasukan Terbesar", "Nominal", "Tanggal"]],
      body: topInc.map((t, i) => [
        `${i + 1}`,
        t.description || t.category?.name || "-",
        rp(t.amount),
        format(parseISO(t.date), "dd MMM"),
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: C.ink, lineColor: C.line },
      headStyles: { fillColor: C.income, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", textColor: C.muted },
        2: { halign: "right", fontStyle: "bold", cellWidth: 30 },
        3: { halign: "right", cellWidth: 20, textColor: C.muted },
      },
    });
  }

  // ── Pola pengeluaran per hari ───────────────────────
  const dowTotals: Record<number, number> = {};
  expenses.forEach((t) => {
    const d = getDay(parseISO(t.date));
    dowTotals[d] = (dowTotals[d] || 0) + t.amount;
  });
  if (Object.keys(dowTotals).length) {
    autoTable(doc, {
      startY: lastY(doc, 38) + 6,
      head: [["Hari", "Total Pengeluaran"]],
      body: DAY_ORDER.map((d) => [DAY_LABEL[d], rp(dowTotals[d] || 0)]),
      theme: "striped",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: C.ink, lineColor: C.line },
      headStyles: { fillColor: C.accent, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: { 1: { halign: "right" } },
    });
  }

  // ── Breakdown per sumber ────────────────────────────
  if (data.sourceBreakdown.length) {
    autoTable(doc, {
      startY: lastY(doc, 38) + 6,
      head: [["Sumber", "Pemasukan", "Pengeluaran", "Net"]],
      body: data.sourceBreakdown.map(({ source, income, expense }) => [
        source.name,
        rp(income),
        rp(expense),
        `${income - expense >= 0 ? "+" : ""}${rp(income - expense)}`,
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.2, textColor: C.ink, lineColor: C.line },
      headStyles: { fillColor: C.ink, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: C.zebra },
      columnStyles: {
        1: { halign: "right", textColor: C.income },
        2: { halign: "right", textColor: C.expense },
        3: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  // ── Footer nomor halaman ────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(
      `Catatan Keuangan • Halaman ${i} / ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const fileName = `laporan-keuangan-${data.periodLabel
    .toLowerCase()
    .replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
