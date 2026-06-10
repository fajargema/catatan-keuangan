-- ========================================================
-- Migration 003: Add Investments Portfolio
-- ========================================================

-- 1. Tabel investasi
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('saham', 'reksadana', 'crypto', 'emas', 'obligasi', 'lainnya')),
  current_val BIGINT DEFAULT 0,
  invested_val BIGINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel transaksi investasi
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'value_change')),
  amount BIGINT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_asset ON investment_transactions(investment_id);

-- 3. RLS Policies
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;
DROP POLICY IF EXISTS "Users can manage their own investment transactions" ON investment_transactions;

CREATE POLICY "Users can manage their own investments" ON investments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own investment transactions" ON investment_transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM investments WHERE investments.id = investment_id AND investments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM investments WHERE investments.id = investment_id AND investments.user_id = auth.uid()
    )
  );

-- 4. Triggers untuk sync saldo dompet & valuasi investasi
CREATE OR REPLACE FUNCTION recalculate_investment_values(target_inv_id UUID)
RETURNS VOID AS $$
DECLARE
  r RECORD;
  running_current BIGINT := 0;
  running_invested BIGINT := 0;
BEGIN
  -- Loop through all transactions for this investment, ordered by date and time
  FOR r IN 
    SELECT type, amount 
    FROM investment_transactions 
    WHERE investment_id = target_inv_id 
    ORDER BY date ASC, created_at ASC 
  LOOP
    IF r.type = 'buy' THEN
      running_invested := running_invested + r.amount;
      running_current := running_current + r.amount;
    ELSIF r.type = 'sell' THEN
      running_invested := running_invested - r.amount;
      running_current := running_current - r.amount;
      
      -- Clamp to 0 if current value becomes negative (e.g. fully sold out at profit/loss)
      IF running_current < 0 THEN
        running_current := 0;
      END IF;
      -- Clamp invested modal to 0 if we sold out or went negative
      IF running_current = 0 OR running_invested < 0 THEN
        running_invested := 0;
      END IF;
    ELSIF r.type = 'value_change' THEN
      running_current := r.amount;
    END IF;
  END LOOP;

  -- Update the investment record
  UPDATE investments 
  SET invested_val = running_invested, 
      current_val = running_current, 
      updated_at = now() 
  WHERE id = target_inv_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_investment_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A. Update saldo dompet (jika ada wallet_id)
    IF NEW.wallet_id IS NOT NULL THEN
      IF NEW.type = 'buy' THEN
        UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
      ELSIF NEW.type = 'sell' OR NEW.type = 'dividend' THEN
        UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
      END IF;
    END IF;

    -- B. Recalculate investment values
    PERFORM recalculate_investment_values(NEW.investment_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- A. Kembalikan saldo dompet (jika ada wallet_id)
    IF OLD.wallet_id IS NOT NULL THEN
      IF OLD.type = 'buy' THEN
        UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      ELSIF OLD.type = 'sell' OR OLD.type = 'dividend' THEN
        UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
      END IF;
    END IF;

    -- B. Recalculate investment values
    PERFORM recalculate_investment_values(OLD.investment_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_investment_transaction
AFTER INSERT OR DELETE ON investment_transactions
FOR EACH ROW EXECUTE FUNCTION handle_investment_transaction();

-- 5. Tambah ke publikasi realtime listener
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'investments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'investment_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investment_transactions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
