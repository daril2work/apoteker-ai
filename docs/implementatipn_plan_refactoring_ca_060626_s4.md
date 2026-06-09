# 🛠️ Implementation Plan — Sprint 4: Backend Hardening & Polish

**Tanggal Dibuat:** 07 Juni 2026
**Tujuan:** Memindahkan validasi bisnis yang kritis ke backend dan memastikan tidak ada celah logika tier langganan yang bisa dieksploitasi.

## 📝 Konteks Status Saat Ini
Berdasarkan hasil investigasi kode terkini:
1. Pengecekan limit (15 dokumen/bulan) *sudah* ada di dalam Edge Functions (`analyze-consultation` dan `analyze-screening`), namun penentuan tier ('free'/'pro') masih bergantung pada manipulasi `user_metadata` frontend.
2. Frontend (`App.tsx` dan `usePharmacyStore.ts`) masih mengambil status tier dari `session.user.user_metadata.tier`.
3. File `supabase_schema.sql` sudah mendefinisikan RLS untuk `usage_logs` (hanya `SELECT` dan `INSERT`), tetapi belum ada penjelasan eksplisit terkait ketiadaan policy `DELETE`.

## ⚙️ Rencana Langkah Eksekusi

### Task 4.1 & 4.2 — Perbaiki Logika Penentuan Tier di Backend & Frontend
Kita akan menggabungkan Task 4.1 dan 4.2 karena saling berkaitan erat.

**Backend (Edge Functions Baru):**
- Buat Edge function baru `supabase/functions/get-user-status/index.ts`.
- Fungsi ini akan menerima `access_token`, melakukan verifikasi user, lalu query ke tabel `subscriptions`:
  `SELECT status, expired_at FROM subscriptions WHERE user_id = auth.uid() AND status = 'active' AND expired_at > NOW() LIMIT 1`
- Kembalikan `{ tier: 'pro' }` jika aktif, `{ tier: 'free' }` jika tidak.

**Backend (Modifikasi AI Edge Functions):**
- Update `analyze-consultation/index.ts` dan `analyze-screening/index.ts`.
- Ganti validasi `userTier` yang mengandalkan `user.user_metadata?.tier` menjadi query `select('status').from('subscriptions')` secara aman di sisi server.
- Tetap pertahankan batas limit >= 15 dokumen.

**Frontend (`src/App.tsx` dan `src/store/usePharmacyStore.ts`):**
- Pada komponen `AppWrapper` (`App.tsx`), ganti sinkronisasi `tier` dari `user_metadata` dengan memanggil `get-user-status`.
- Ini memastikan indikator status "PRO" di UI juga divalidasi ke database.

### Task 4.3 — Tambahkan Penjelasan RLS Policy DELETE untuk `usage_logs`
**File:** `supabase_schema.sql`
- Tambahkan komentar/dokumentasi eksplisit di bagian bawah `usage_logs` RLS yang menjelaskan bahwa ketiadaan RLS policy `DELETE` pada tabel `usage_logs` adalah disengaja demi mempertahankan *audit trail* rekam medis yang legal.

### Task 4.4 — Final QA & Regression Testing
- Uji alur `get-user-status` di frontend saat *login* dan pengecekan tier.
- Verifikasi keamanan: Coba lakukan permintaan ke endpoint Edge Function langsung dengan pengguna *Free* yang melebihi batas, pastikan tertolak (HTTP 429).
