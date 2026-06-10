"use client";

import { useState } from "react";
import { Mail, Lock, Wallet, Eye, EyeOff, TrendingUp, Shield, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

const features = [
  { icon: TrendingUp, label: "Lacak Pemasukan & Pengeluaran" },
  { icon: Shield,     label: "Data Aman dengan Enkripsi" },
  { icon: Zap,        label: "Laporan Keuangan Real-time" },
];

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpErr) throw signUpErr;

        if (data.user && data.session === null) {
          setSuccessMessage("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.");
          setEmail("");
          setPassword("");
        } else {
          setSuccessMessage("Pendaftaran berhasil! Sesi otomatis aktif.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background radial orbs */}
      <div
        style={{
          position: "absolute", top: "15%", left: "10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "10%", right: "8%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", top: "55%", left: "60%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        className="w-full animate-scale-in"
        style={{
          maxWidth: 440,
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: 24,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "36px 36px 32px",
          boxShadow: "var(--shadow-float)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Top shimmer line */}
        <div
          style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), rgba(6,182,212,0.3), transparent)",
            borderRadius: 24,
          }}
        />

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14,
              boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
            }}
          >
            <Wallet size={26} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em",
              background: "linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan), var(--accent-indigo))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            Catatan Keuangan
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
            Kelola finansial pribadi Anda dengan mudah
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  fontSize: "0.7rem", fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                <Icon size={11} style={{ color: "var(--accent-emerald)" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className="flex mb-6 p-1 rounded-xl"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          {["Masuk", "Daftar"].map((label, i) => {
            const active = isLogin ? i === 0 : i === 1;
            return (
              <button
                key={label}
                onClick={() => switchMode(i === 0)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: active
                    ? "linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))"
                    : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  outline: "none",
                }}
                id={i === 0 ? "tab-login" : "tab-register"}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Alerts */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "var(--color-expense-dim)",
              border: "1px solid rgba(244,63,94,0.2)",
              color: "var(--color-expense)",
            }}
          >
            {error === "Invalid login credentials"
              ? "Email atau password salah"
              : error}
          </div>
        )}
        {successMessage && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "var(--color-income-dim)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "var(--color-income)",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-secondary)" }}
              htmlFor="auth-email-input"
            >
              Alamat Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute", top: "50%", left: 14,
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)", pointerEvents: "none",
                  zIndex: 10,
                }}
              />
              <input
                type="email"
                id="auth-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-secondary)" }}
              htmlFor="auth-password-input"
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute", top: "50%", left: 14,
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)", pointerEvents: "none",
                  zIndex: 10,
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                id="auth-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 40, paddingRight: 44 }}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", top: "50%", right: 12,
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-tertiary)", padding: 4,
                }}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ padding: "13px", marginTop: 8, fontSize: "0.9rem" }}
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Memproses...
              </span>
            ) : isLogin ? "Masuk ke Akun" : "Buat Akun"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
