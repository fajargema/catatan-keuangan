"use client";

import { useState } from "react";
import { X, User, Lock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface EditProfileModalProps {
  user: SupabaseUser;
  onClose: () => void;
}

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    try {
      setLoading(true);
      const updates: { data: { display_name: string }; password?: string } = {
        data: { display_name: displayName.trim() }
      };

      if (password) {
        updates.password = password;
      }

      const { error: updateErr } = await supabase.auth.updateUser(updates);
      if (updateErr) throw updateErr;

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profil"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Edit Profil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-expense/10 border border-expense/20 text-expense text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-income/10 border border-income/20 text-income text-sm flex items-center gap-2 animate-fade-in">
            <Check size={16} />
            <span>Profil berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Email (Tidak dapat diubah)
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="form-input opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted pointer-events-none z-10">
                <User size={16} />
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input !pl-10"
                placeholder="Contoh: Budi Santoso"
                autoFocus
              />
            </div>
          </div>

          <div className="border-t border-card-border/50 pt-4">
            <h3 className="text-sm font-semibold mb-3">Ubah Password (Opsional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted pointer-events-none z-10">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input !pl-10"
                    placeholder="Min. 6 karakter"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted pointer-events-none z-10">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input !pl-10"
                    placeholder="Min. 6 karakter"
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
