-- ========================================================
-- Migration 002: Add User Authentication & Data Isolation
-- ========================================================

-- 1. Tambah kolom user_id pada tabel wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 2. Tambah kolom user_id pada tabel transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 3. Tambah kolom user_id pada tabel categories (nullable untuk default categories)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Pastikan Row Level Security (RLS) Aktif
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Bersihkan/Drop Policy lama jika ada
DROP POLICY IF EXISTS "Allow all on wallets" ON wallets;
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can see default categories and their own" ON categories;

-- 6. Buat Policy RLS baru yang aman
CREATE POLICY "Users can manage their own wallets" ON wallets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = wallet_id AND wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = wallet_id AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can see default categories and their own" ON categories
  FOR ALL
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Daftarkan tabel ke realtime publication jika belum ada (Safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
