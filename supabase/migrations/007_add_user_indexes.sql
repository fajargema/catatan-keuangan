-- ========================================================
-- Migration 007: Index untuk Query per-User
-- Jalankan di Supabase SQL Editor
-- ========================================================
-- Sejak migration 002 semua query difilter user_id terlebih
-- dahulu, tetapi belum ada index-nya. Composite index
-- (user_id, date DESC) meng-cover pola query utama aplikasi:
-- WHERE user_id = ? AND date BETWEEN ? ORDER BY date DESC.

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_wallets_user
  ON wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user
  ON categories(user_id);

CREATE INDEX IF NOT EXISTS idx_sources_user
  ON sources(user_id);
