"use client";

import { useState } from "react";
import { Plus, Wallet, ArrowLeftRight, Eye, EyeOff } from "lucide-react";
import { useWallets } from "@/hooks/useWallets";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import WalletCard from "@/components/wallets/WalletCard";
import WalletForm from "@/components/wallets/WalletForm";
import TransferForm from "@/components/wallets/TransferForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useToast } from "@/context/ToastContext";
import type { Wallet as WalletType, WalletFormData } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

export default function WalletsPage() {
  const {
    wallets,
    totalBalance,
    loading,
    error,
    addWallet,
    updateWallet,
    deleteWallet,
    transferBetweenWallets,
    refetch,
  } = useWallets();
  const { showToast } = useToast();
  const { hidden: hideBalance, toggle: toggleBalance } = useBalanceVisibility();
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);

  const deletingWallet = wallets.find((w) => w.id === deletingWalletId);

  const handleEdit = (wallet: WalletType) => {
    setEditingWallet(wallet);
    setShowForm(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingWalletId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWalletId) return;
    try {
      await deleteWallet(deletingWalletId);
      showToast("Dompet berhasil dihapus.", "success");
    } catch {
      showToast("Gagal menghapus dompet.", "error");
    } finally {
      setDeletingWalletId(null);
    }
  };

  const handleSubmit = async (data: WalletFormData) => {
    try {
      if (editingWallet) {
        await updateWallet(editingWallet.id, data);
        showToast("Dompet berhasil diperbarui!", "success");
      } else {
        await addWallet(data);
        showToast("Dompet baru berhasil ditambahkan!", "success");
      }
    } catch {
      showToast("Gagal menyimpan dompet.", "error");
      throw new Error("Gagal menyimpan dompet");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWallet(null);
  };

  const handleTransfer = async (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    date: string,
    notes?: string
  ) => {
    try {
      await transferBetweenWallets(fromWalletId, toWalletId, amount, date, notes);
      showToast("Transfer berhasil dilakukan!", "success");
    } catch {
      showToast("Gagal melakukan transfer.", "error");
      throw new Error("Gagal melakukan transfer");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between animate-slide-in-right">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Dompet</h1>
          <p className="text-xs sm:text-sm text-muted">Kelola dompet dan saldo Anda</p>
        </div>
        <div className="flex items-center gap-2">
          {wallets.length >= 2 && (
            <button
              onClick={() => setShowTransferForm(true)}
              className="btn-secondary"
              id="transfer-wallet-btn"
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">Transfer</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            id="add-wallet-btn"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tambah Dompet</span>
          </button>
        </div>
      </div>

      {/* Error dari fetch data */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Total Balance */}
      <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent-blue/20 flex items-center justify-center">
          <Wallet size={22} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">Total Saldo Semua Dompet</p>
          <p className="text-2xl font-bold gradient-text">
            {loading ? "..." : hideBalance ? "Rp ••••••••" : formatRupiah(totalBalance)}
          </p>
        </div>
        <button
          onClick={toggleBalance}
          className="eye-toggle ml-auto shrink-0"
          style={{ width: 34, height: 34, borderRadius: 10 }}
          aria-label={hideBalance ? "Tampilkan saldo" : "Sembunyikan saldo"}
          aria-pressed={hideBalance}
          id="toggle-balance-visibility-wallets"
        >
          {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {/* Wallet Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card flex flex-col justify-between p-5"
              style={{ minHeight: 190, borderRadius: 22 }}
            >
              <div className="flex items-start justify-between">
                <div className="skeleton h-7 w-10 rounded-lg" />
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
              <div>
                <div className="skeleton h-4 w-24 mb-2 rounded" />
                <div className="skeleton h-6 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <Wallet size={48} className="text-muted" />
          <p className="text-lg font-medium mt-2">Belum ada dompet</p>
          <p className="text-sm text-muted mt-1 mb-4">
            Klik &quot;Tambah Dompet&quot; untuk membuat dompet pertama Anda.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            id="empty-state-add-wallet-btn"
          >
            <Plus size={16} />
            Tambah Dompet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferForm && (
        <TransferForm
          wallets={wallets}
          onSubmit={handleTransfer}
          onClose={() => setShowTransferForm(false)}
        />
      )}

      {/* Wallet Form Modal */}
      {showForm && (
        <WalletForm
          key={editingWallet?.id ?? "new"}
          wallet={editingWallet}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingWalletId && (
        <ConfirmDialog
          title="Hapus Dompet"
          message={`Yakin ingin menghapus dompet "${deletingWallet?.name}"? Semua transaksi terkait juga akan terhapus secara permanen.`}
          confirmLabel="Ya, Hapus"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingWalletId(null)}
        />
      )}
    </div>
  );
}
