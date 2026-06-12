"use client";

import { useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Sidebar from "@/components/layout/Sidebar";
import AuthScreen from "@/components/auth/AuthScreen";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-muted">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Tampilkan form login jika user tidak aktif/belum masuk
  if (!user) {
    return <AuthScreen />;
  }

  // Tampilkan dashboard/konten utama jika user aktif
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Sidebar />
        <main className="lg:ml-64 min-h-screen pb-28 lg:pb-0">
          <div className="p-4 lg:p-8 pt-6 lg:pt-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <BottomNav />
      </ErrorBoundary>
    </ToastProvider>
  );
}

