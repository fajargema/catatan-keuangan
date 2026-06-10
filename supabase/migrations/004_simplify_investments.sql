-- ========================================================
-- Migration 004: Simplify Investments (Manual Tracking Only)
-- ========================================================

-- 1. Hapus trigger, function, dan tabel transaksi investasi
DROP TRIGGER IF EXISTS trigger_investment_transaction ON investment_transactions;
DROP FUNCTION IF EXISTS handle_investment_transaction();
DROP FUNCTION IF EXISTS recalculate_investment_values(target_inv_id UUID);
DROP TABLE IF EXISTS investment_transactions CASCADE;

-- 2. Modifikasi tabel investasi
-- Hapus kolom modal awal/invested_val karena pelacakan modal dihilangkan
ALTER TABLE investments DROP COLUMN IF EXISTS invested_val;
