-- ============================================
-- Migration 005: Add Sources Table
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tabel Sources (Sumber Dana)
CREATE TABLE sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️',
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Seed default sources (global / no user_id agar semua user bisa melihatnya)
INSERT INTO sources (name, icon, color) VALUES
  ('Personal', '👤', '#3b82f6'),
  ('Bisnis',   '💼', '#8b5cf6');

-- Tambah kolom source_id ke tabel transactions
ALTER TABLE transactions
  ADD COLUMN source_id UUID REFERENCES sources(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on sources" ON sources FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX idx_transactions_source ON transactions(source_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sources;
