-- ============================================
-- Catatan Keuangan - Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tabel Dompet
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#10b981',
  balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Kategori
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Transaksi
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount BIGINT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk performa query
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================
-- Seed Data: Kategori Default
-- ============================================

-- Kategori Pemasukan
INSERT INTO categories (name, type, icon, color) VALUES
  ('Gaji', 'income', '💼', '#10b981'),
  ('Freelance', 'income', '💻', '#06b6d4'),
  ('Investasi', 'income', '📈', '#8b5cf6'),
  ('Hadiah', 'income', '🎁', '#f59e0b'),
  ('Lainnya', 'income', '💵', '#6b7280');

-- Kategori Pengeluaran
INSERT INTO categories (name, type, icon, color) VALUES
  ('Makanan', 'expense', '🍔', '#ef4444'),
  ('Transportasi', 'expense', '🚗', '#f97316'),
  ('Belanja', 'expense', '🛒', '#ec4899'),
  ('Hiburan', 'expense', '🎮', '#a855f7'),
  ('Tagihan', 'expense', '📄', '#64748b'),
  ('Kesehatan', 'expense', '🏥', '#14b8a6'),
  ('Pendidikan', 'expense', '📚', '#3b82f6'),
  ('Lainnya', 'expense', '💸', '#6b7280');

-- ============================================
-- RLS Policies (Row Level Security) - Disabled for no-auth app
-- ============================================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth)
CREATE POLICY "Allow all on wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Function: Update wallet balance after transaction
-- ============================================
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE wallets SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.wallet_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE wallets SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.wallet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old transaction
    IF OLD.type = 'income' THEN
      UPDATE wallets SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.wallet_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'income' THEN
      UPDATE wallets SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Enable Realtime replication for Postgres changes listeners
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

