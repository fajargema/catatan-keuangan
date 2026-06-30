-- ========================================================
-- Migration 010: RPC pembuatan pembelian PayLater atomik
-- Jalankan di Supabase SQL Editor
-- ========================================================
-- Sebelumnya aplikasi meng-insert paylater_purchases lalu
-- paylater_installments dalam dua panggilan terpisah; bila
-- insert cicilan gagal, tertinggal "purchase yatim" tanpa
-- cicilan dan tanpa rollback.
--
-- Function ini menggabungkan keduanya dalam satu transaksi DB
-- (function plpgsql berjalan atomik): bila salah satu insert
-- gagal, keduanya di-rollback.
--
-- Nominal cicilan (p_amounts) dan tanggal jatuh tempo (p_due_dates)
-- tetap dihitung di aplikasi (pola SPayLater + pembagian rata
-- dengan sisa di cicilan terakhir), function hanya menyimpannya.
-- SECURITY INVOKER (default): RLS tetap berlaku, auth.uid() =
-- user pemanggil, sehingga WITH CHECK per-user tetap menjaga
-- kepemilikan data.

CREATE OR REPLACE FUNCTION create_paylater_purchase(
  p_account_id   UUID,
  p_description  TEXT,
  p_amount       BIGINT,
  p_tenor        INT,
  p_purchase_date DATE,
  p_category_id  UUID,
  p_amounts      BIGINT[],
  p_due_dates    DATE[]
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_purchase_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;

  -- Validasi panjang array harus sama dengan tenor agar tidak ada
  -- cicilan yang nominal/jatuh temponya hilang.
  IF array_length(p_amounts, 1) IS DISTINCT FROM p_tenor
     OR array_length(p_due_dates, 1) IS DISTINCT FROM p_tenor THEN
    RAISE EXCEPTION 'Jumlah cicilan tidak sesuai tenor';
  END IF;

  INSERT INTO paylater_purchases
    (account_id, description, amount, tenor, purchase_date, category_id, user_id)
  VALUES
    (p_account_id, p_description, p_amount, p_tenor, p_purchase_date, p_category_id, v_uid)
  RETURNING id INTO v_purchase_id;

  INSERT INTO paylater_installments
    (purchase_id, installment_no, amount, due_date, paid, user_id)
  SELECT
    v_purchase_id,
    gs.i,
    p_amounts[gs.i],
    p_due_dates[gs.i],
    false,
    v_uid
  FROM generate_series(1, p_tenor) AS gs(i);

  RETURN v_purchase_id;
END;
$$;
