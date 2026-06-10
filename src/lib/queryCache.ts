/**
 * Cache in-memory sederhana ala stale-while-revalidate.
 *
 * Data hasil fetch disimpan per-key (sudah termasuk userId) sehingga saat
 * user berpindah halaman, hook data bisa langsung menampilkan data terakhir
 * tanpa skeleton, lalu melakukan revalidasi di latar belakang.
 *
 * Cache hanya hidup selama sesi tab (hilang saat reload) dan key selalu
 * di-scope per user, jadi tidak ada kebocoran data antar akun.
 */
const cache = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, data);
}
