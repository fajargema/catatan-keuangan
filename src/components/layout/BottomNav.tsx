"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Menu,
  PieChart,
  ScanLine
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden flex justify-center pointer-events-none">
      <nav 
        className="w-full max-w-md glass-card rounded-[32px] border shadow-float pointer-events-auto" 
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="flex items-center justify-between h-16 px-2 relative">
          
          {/* Dashboard */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors"
            style={{ color: pathname === "/" ? "var(--accent-emerald)" : "var(--text-secondary)" }}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          {/* Report */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors"
            style={{ color: pathname === "/reports" ? "var(--accent-emerald)" : "var(--text-secondary)" }}
          >
            <PieChart size={20} />
            <span className="text-[10px] font-medium">Report</span>
          </Link>

          {/* Transaksi (Middle Floating Button) */}
          <div className="flex flex-col items-center justify-center w-[20%] h-full relative">
            <div className="absolute -top-[22px]">
              <Link
                href="/transactions"
                className="flex items-center justify-center w-[52px] h-[52px] rounded-2xl rotate-45 transition-transform hover:scale-105 shadow-btn"
                style={{ background: "var(--accent-emerald)" }}
                aria-label="Transaksi"
              >
                <ScanLine size={24} className="text-white -rotate-45" />
              </Link>
            </div>
            <span 
              className="text-[10px] font-medium absolute bottom-3 transition-colors" 
              style={{ color: pathname === "/transactions" ? "var(--accent-emerald)" : "var(--text-secondary)" }}
            >
              Transaksi
            </span>
          </div>

          {/* Dompet */}
          <Link
            href="/wallets"
            className="flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors"
            style={{ color: pathname === "/wallets" ? "var(--accent-emerald)" : "var(--text-secondary)" }}
          >
            <Wallet size={20} />
            <span className="text-[10px] font-medium">Dompet</span>
          </Link>

          {/* Lainnya */}
          <button
            onClick={() => document.getElementById("sidebar-toggle")?.click()}
            className="flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Menu"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
          
        </div>
      </nav>
    </div>
  );
}
