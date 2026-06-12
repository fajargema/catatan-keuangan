"use client";

import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useSources } from "@/hooks/useSources";
import SourceCard from "@/components/sources/SourceCard";
import SourceForm from "@/components/sources/SourceForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useToast } from "@/context/ToastContext";
import type { Source, SourceFormData } from "@/lib/types";

export default function SourcesPage() {
  const { sources, loading, error, addSource, updateSource, deleteSource, refetch } =
    useSources();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  const deletingSource = sources.find((s) => s.id === deletingSourceId);

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setShowForm(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingSourceId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSourceId) return;
    try {
      await deleteSource(deletingSourceId);
      showToast("Sumber berhasil dihapus.", "success");
    } catch {
      showToast("Gagal menghapus sumber.", "error");
    } finally {
      setDeletingSourceId(null);
    }
  };

  const handleSubmit = async (data: SourceFormData) => {
    try {
      if (editingSource) {
        await updateSource(editingSource.id, data);
        showToast("Sumber berhasil diperbarui!", "success");
      } else {
        await addSource(data);
        showToast("Sumber baru berhasil ditambahkan!", "success");
      }
    } catch {
      showToast("Gagal menyimpan sumber.", "error");
      throw new Error("Gagal menyimpan sumber");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSource(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between animate-slide-in-right">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Sumber Dana</h1>
          <p className="text-xs sm:text-sm text-muted">
            Kelola sumber keuangan Anda
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          id="add-source-btn"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Sumber</span>
        </button>
      </div>

      {/* Error dari fetch data */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Info Banner */}
      <div className="glass-card p-4 flex items-start gap-3 animate-fade-in border-l-4 border-accent">
        <Tags size={18} className="text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Sumber Dana Dinamis</p>
          <p className="text-xs text-muted mt-0.5">
            Buat sumber sebanyak yang Anda butuhkan. Setiap transaksi dapat ditandai dengan
            sumber untuk memisahkan keuangan personal, bisnis, dan lainnya.
          </p>
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div>
                  <div className="skeleton h-4 w-20 mb-1" />
                  <div className="skeleton h-3 w-14" />
                </div>
              </div>
              <div className="skeleton h-1 w-full mt-4 rounded-full" />
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <Tags size={48} className="text-muted" />
          <p className="text-lg font-medium mt-2">Belum ada sumber</p>
          <p className="text-sm text-muted mt-1">
            Klik &quot;Tambah Sumber&quot; untuk membuat sumber pertama Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Source Form Modal */}
      {showForm && (
        <SourceForm
          key={editingSource?.id ?? "new"}
          source={editingSource}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingSourceId && (
        <ConfirmDialog
          title="Hapus Sumber"
          message={`Yakin ingin menghapus sumber "${deletingSource?.name}"? Transaksi yang menggunakan sumber ini tidak akan terhapus, namun referensi sumbernya akan hilang.`}
          confirmLabel="Ya, Hapus"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingSourceId(null)}
        />
      )}
    </div>
  );
}
