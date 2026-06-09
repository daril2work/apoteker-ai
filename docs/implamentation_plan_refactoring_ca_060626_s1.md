# 🚀 Laporan Hasil Sprint 1 — Keamanan & Quick Fixes Kritis (FarmasiKu)

**Tanggal Penyelesaian:** 06 Juni 2026  
**Status Sprint:** ✅ Selesai (Sukses Dideploy & Diverifikasi)

---

## 🛠️ Detail Perbaikan & Langkah yang Dilakukan

### Task 1.1 — Pindahkan AI ke Supabase Edge Function
* **Tujuan:** Mengamankan API key Sumopod agar tidak terekspos di frontend browser.
* **Tindakan:**
  * Menulis ulang [aiService.ts](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/src/services/aiService.ts) untuk memanggil API gateway lokal Supabase Edge Functions daripada memanggil Sumopod secara langsung.
  * Membuat dua Supabase Edge Functions di folder local:
    * [analyze-consultation](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/supabase/functions/analyze-consultation/index.ts)
    * [analyze-screening](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/supabase/functions/analyze-screening/index.ts)
  * Menghubungkan project lokal dengan benar ke proyek Supabase FarmasiKu: **`jcosiurxwyqhgqlfzszi`**.
  * Menyimpan credentials `SUMOPOD_API_KEY` dan `SUMOPOD_BASE_URL` sebagai **Supabase Secret** di server-side secara aman.
  * Mendeploy kedua Edge Functions tersebut ke server cloud Supabase FarmasiKu.

### Task 1.2 — Perbaiki Double `loadUserData()` Call
* **Tujuan:** Menghindari pemanggilan data user ganda ke database saat pertama kali aplikasi dibuka.
* **Tindakan:**
  * Menghapus baris pemanggilan `loadUserData()` dari dalam callback handler `.getSession()` di [App.tsx](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/src/App.tsx).
  * Memastikan pemanggilan data profil pengguna hanya dipicu sekali oleh event listener `onAuthStateChange`.

### Task 1.3 — Pastikan Aset Gambar Landing Page Ada
* **Tujuan:** Menghindari error 404 ketika aset visual landing page dimuat.
* **Tindakan:**
  * Melakukan verifikasi manual terhadap direktori `public/`.
  * Memastikan file [hero-mockup.png](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/public/hero-mockup.png), [dashboard-mockup.png](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/public/dashboard-mockup.png), dan [ebm-algorithm.png](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/public/ebm-algorithm.png) telah tersedia secara lokal dengan ukuran yang valid.

### Task 1.4 — Perbaiki Duplikasi Animasi CSS
* **Tujuan:** Menghilangkan tag CSS inline yang tidak efisien dan duplikat.
* **Tindakan:**
  * Menghapus blok tag `<style>` inline yang berisi keyframes `@keyframes spin` dan kelas `.animate-spin` dari file `App.tsx`.
  * Memindahkan dan merapikan deklarasi animasi CSS tersebut ke dalam file stylesheet utama [index.css](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/src/index.css).

---

## 🧪 Hasil Pengujian & Verifikasi

1. **Local Build Check:** 
   Perintah `npm run build` berhasil diselesaikan tanpa ada kendala kompilasi TypeScript maupun bundler Vite.
2. **Keamanan Frontend:**
   Variabel lingkungan `VITE_SUMOPOD_API_KEY` dan `VITE_SUMOPOD_BASE_URL` telah dihapus sepenuhnya dari `.env` dan kode React. Tidak ada API key sensitif yang bocor ke bundle JavaScript frontend.
3. **Koneksi Supabase:**
   Local CLI sukses ter-link ke Reference ID proyek yang tepat (`jcosiurxwyqhgqlfzszi`).
