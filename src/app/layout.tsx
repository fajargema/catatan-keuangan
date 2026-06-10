import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";

// Font di-self-host saat build oleh next/font — tanpa request ke Google Fonts
// saat runtime, tanpa render-blocking, dan tanpa layout shift.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: "Catatan Keuangan - Pencatatan Keuangan Pribadi",
  description:
    "Aplikasi pencatatan keuangan pribadi untuk mengelola dompet, pemasukan, pengeluaran, dan laporan keuangan.",
};

// Dijalankan sebelum paint pertama agar tidak ada flash tema yang salah.
const themeInitScript = `try{var t=localStorage.getItem("theme")||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var c=document.documentElement.classList;c.remove("light","dark");c.add(t);}catch(e){}`;

// Buka koneksi ke Supabase sejak halaman dimuat (paralel dengan load JS),
// memangkas ~0,5 dtk TLS handshake dari request data pertama setelah login.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`h-full antialiased dark ${plexSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
