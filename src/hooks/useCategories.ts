"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getCached, setCached } from "@/lib/queryCache";
import type { Category } from "@/lib/types";

export function useCategories() {
  const { userId } = useAuth();
  const cacheKey = `categories:${userId}`;
  // Stale-while-revalidate: tampilkan data cache dulu, revalidasi di belakang
  const [categories, setCategories] = useState<Category[]>(
    () => getCached<Category[]>(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;

    try {
      if (!getCached(cacheKey)) setLoading(true);

      const { data, error: err } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order("name", { ascending: true });

      if (err) throw err;
      setCategories(data || []);
      setCached(cacheKey, data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
