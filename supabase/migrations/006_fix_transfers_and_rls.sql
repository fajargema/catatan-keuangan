-- ========================================================
-- Migration 006: Fix Transfer Tracking & RLS Security
-- Jalankan di Supabase SQL Editor
-- ========================================================

-- --------------------------------------------------------
-- 1. Tandai transaksi transfer dengan kolom khusus
--    (sebelumnya hanya ditandai string "[TRANSFER]" di
--    description, sehingga ikut terhitung sebagai
--    pemasukan/pengeluaran asli di laporan)
-- --------------------------------------------------------
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT false;

-- Backfill: tandai transaksi transfer lama
UPDATE transactions
SET is_transfer = true
WHERE description LIKE '[TRANSFER]%';

-- --------------------------------------------------------
-- 2. Perbaiki RLS tabel sources
--    Policy lama "Allow all" membiarkan user mana pun
--    (termasuk anon) membaca/mengubah/menghapus sources
--    milik user lain.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on sources" ON sources;
DROP POLICY IF EXISTS "Sources viewable by owner or global" ON sources;
DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;
DROP POLICY IF EXISTS "Users can update their own sources" ON sources;
DROP POLICY IF EXISTS "Users can delete their own sources" ON sources;

CREATE POLICY "Sources viewable by owner or global" ON sources
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources" ON sources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources" ON sources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources" ON sources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 3. Perbaiki RLS tabel categories
--    Policy lama FOR ALL dengan USING (user_id IS NULL OR ...)
--    membiarkan user terautentikasi MENGHAPUS kategori
--    default global (DELETE tidak dicek WITH CHECK).
--    Dipecah per-operasi: default hanya bisa dibaca.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Users can see default categories and their own" ON categories;
DROP POLICY IF EXISTS "Categories viewable by owner or default" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Categories viewable by owner or default" ON categories
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
