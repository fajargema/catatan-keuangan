-- ========================================================
-- Migration 011: Modal (untung/rugi), unit/lot, & riwayat
--                nilai portofolio investasi
-- Jalankan di Supabase SQL Editor
-- ========================================================
-- Menambah dimensi yang sebelumnya hilang dari tracker:
--   1. cost_basis  : total modal/uang yang diinvestasikan →
--                    untung/rugi = current_val - cost_basis.
--   2. units + avg_price : detail jumlah unit/lot & harga
--                    rata-rata beli (opsional, untuk saham/
--                    reksadana/crypto). NUMERIC agar bisa pecahan.
--   3. investment_snapshots : satu baris per bulan berisi total
--                    nilai & modal portofolio → grafik pertumbuhan.

-- --------------------------------------------------------
-- 1. Kolom baru pada investments
-- --------------------------------------------------------
ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS cost_basis BIGINT NOT NULL DEFAULT 0;

ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS units NUMERIC;

ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS avg_price NUMERIC;

-- --------------------------------------------------------
-- 2. Tabel snapshot portofolio (riwayat nilai bulanan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  -- Periode "YYYY-MM"; satu baris per bulan per user (di-upsert).
  period TEXT NOT NULL,
  total_value BIGINT NOT NULL DEFAULT 0,
  total_cost BIGINT NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_investment_snapshots_user_period
  ON investment_snapshots(user_id, period);

-- --------------------------------------------------------
-- 3. RLS per-user
-- --------------------------------------------------------
ALTER TABLE investment_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own investment snapshots" ON investment_snapshots;
CREATE POLICY "Users manage own investment snapshots" ON investment_snapshots
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- 4. Realtime (aman bila sudah terdaftar)
-- --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'investment_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investment_snapshots;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
