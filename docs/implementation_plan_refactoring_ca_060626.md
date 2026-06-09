# 🛠️ Implementation Plan — Refactoring FarmasiKu
**Berdasarkan:** Code Audit `code_audit_060626.md`  
**Tanggal Dibuat:** 06 Juni 2026  
**Total Estimasi:** 4 Sprint × ~3 Hari Kerja = ~2 Minggu

---

## Konteks & Tujuan

Dokumen ini adalah rencana implementasi terstruktur untuk menyelesaikan semua temuan dari audit kode tanggal 06/06/2026. Prioritas utama adalah **keamanan** (Sprint 1) sebelum masuk ke *refactoring* arsitektur (Sprint 2–3) dan polish (Sprint 4).

**Prinsip Eksekusi:**
- Selesaikan satu sprint sebelum mulai sprint berikutnya
- Tidak menambah fitur baru selama sprint ini berlangsung
- Setiap sprint harus diakhiri dengan aplikasi yang tetap bisa berjalan (tidak boleh *breaking*)

---

## Sprint 1 — Keamanan & Quick Fixes Kritis [COMPLETED]
**Estimasi:** 2–3 hari kerja  
**Status:** ✅ Selesai (06 Juni 2026)
**Prioritas:** 🔴 Harus selesai SEBELUM ada user baru yang onboard

### Tujuan Sprint
Menutup celah keamanan API key yang terekspos, dan memperbaiki bug-bug minor yang dapat diselesaikan dengan cepat.

---

### Task 1.1 — Pindahkan AI ke Supabase Edge Function
**Temuan:** Kritis #1 — API Key AI terekspos di frontend  
**File yang terpengaruh:** `src/services/aiService.ts`, `.env`, `supabase/functions/`

**Langkah:**
1. Buat dua Supabase Edge Functions baru:
   - `supabase/functions/analyze-consultation/index.ts`
   - `supabase/functions/analyze-screening/index.ts`
2. Pindahkan seluruh logika `analyzeConsultation()` dan `analyzePrescription()` ke masing-masing Edge Function
3. Simpan `SUMOPOD_API_KEY` dan `SUMOPOD_BASE_URL` sebagai **Supabase Secret** (bukan di `.env` frontend)
4. Di `aiService.ts` (frontend), ganti pemanggilan langsung ke Sumopod dengan fetch ke URL Edge Function, dilengkapi `Authorization: Bearer {session.access_token}`
5. Hapus `VITE_SUMOPOD_API_KEY` dan `VITE_SUMOPOD_BASE_URL` dari `.env` dan dari kode frontend
6. Hapus `openai` dari `dependencies` di `package.json` (tidak lagi dibutuhkan di frontend)
7. Update `.gitignore` untuk memastikan `.env` tidak pernah ter-commit

**Hasil yang diharapkan:** API key tidak lagi bisa dilihat oleh siapapun di browser. Fungsionalitas AI tetap bekerja sama persis.

**Catatan penting:** Edge Function mendukung streaming SSE, pastikan implementasi menggunakan `ReadableStream` agar streaming response AI tetap berfungsi di frontend.

---

### Task 1.2 — Perbaiki Double `loadUserData()` Call
**Temuan:** Observasi #6  
**File:** `src/App.tsx` (baris ~1405-1420)

**Langkah:**
1. Hapus panggilan `loadUserData()` dari dalam callback `getSession()`
2. Biarkan hanya panggilan dari `onAuthStateChange()` yang tetap berjalan (ini sudah cukup, karena `onAuthStateChange` juga terpanggil saat session pertama kali terdeteksi)

**Sebelum:**
```typescript
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null);
  if (session?.user?.user_metadata?.tier) setTier(session.user.user_metadata.tier);
  if (session?.user) usePharmacyStore.getState().loadUserData(); // ← HAPUS BARIS INI
  setSessionLoading(false);
});
```

**Setelah:** Panggilan `loadUserData()` hanya ada di dalam `onAuthStateChange`.

---

### Task 1.3 — Pastikan Aset Gambar Landing Page Ada
**Temuan:** Sedang #8 — Gambar bisa 404  
**File:** `public/`, `src/components/LandingPage.tsx`

**Langkah:**
1. Cek apakah `public/hero-mockup.png`, `public/dashboard-mockup.png`, dan `public/ebm-algorithm.png` sudah ada
2. Jika belum: buat *placeholder* gambar yang layak (bisa screenshot dari aplikasi yang sudah berjalan, atau gambar mockup sederhana) dan letakkan di `public/`
3. Alternatif: ganti `<img src="/...">` dengan komponen fallback yang menampilkan ilustrasi SVG bawaan jika gambar gagal dimuat

---

### Task 1.4 — Perbaiki Duplikasi Animasi CSS
**Temuan:** Observasi #9  
**File:** `src/App.tsx` (baris ~1365 & ~1426), `src/index.css`

**Langkah:**
1. Pindahkan definisi `.animate-spin` dan `@keyframes spin` ke `src/index.css` (satu kali saja)
2. Hapus kedua blok `<style>` inline di `App.tsx` yang berisi animasi ini

---

## Sprint 2 — Resolusi Inkonsistensi CSS [COMPLETED]
**Estimasi:** 2–3 hari kerja  
**Status:** ✅ Selesai (06 Juni 2026)
**Prioritas:** ⚠️ Harus selesai sebelum scale atau update UI besar

### Tujuan Sprint
Memilih satu sistem CSS dan menghilangkan inkonsistensi antara Tailwind (di LandingPage) dan Vanilla CSS (di halaman lain).

---

### Task 2.1 — Keputusan Arsitektur CSS
**Temuan:** Sedang #4 — Tailwind tidak terinstall tapi digunakan

Sebelum eksekusi, ada satu keputusan yang harus dibuat:

> **Pilihan A (Direkomendasikan): Install & Konfigurasi Tailwind secara resmi**
> - Cocok karena LandingPage sudah 469 baris dengan Tailwind, rewrite penuh akan memakan waktu
> - Tambahkan Tailwind ke `devDependencies` dan konfigurasi `tailwind.config.js`
> - Pastikan `index.css` menggunakan `@tailwind base; @tailwind components; @tailwind utilities;`
>
> **Pilihan B: Konversi LandingPage ke Vanilla CSS**
> - Lebih konsisten dengan halaman lain
> - Membutuhkan ~1–2 hari rewrite seluruh LandingPage

**Sprint ini mengasumsikan Pilihan A (Install Tailwind).**

---

### Task 2.2 — Install dan Konfigurasi Tailwind CSS
**File:** `package.json`, `tailwind.config.js`, `vite.config.ts`, `src/index.css`

**Langkah:**
1. Install Tailwind: `npm install -D tailwindcss @tailwindcss/vite`
2. Buat `tailwind.config.js` dengan content scanning untuk semua file `.tsx`
3. Update `vite.config.ts` untuk menyertakan Tailwind plugin
4. Tambahkan `@tailwind` directives ke `src/index.css`
5. Audit ulang `index.css` — pisahkan *design tokens* (CSS variables) dari *component styles* yang ada agar tidak konflik dengan Tailwind reset

---

### Task 2.3 — Audit dan Selaraskan Design Tokens
**File:** `src/index.css`

**Langkah:**
1. Pertahankan semua CSS Custom Properties (`:root { --primary: ... }`) — ini adalah *design system* yang sudah bagus
2. Buat `tailwind.config.js` yang memetakan token tersebut ke Tailwind: 
   ```js
   // tailwind.config.js
   theme: { extend: { colors: { primary: 'var(--primary)', ... } } }
   ```
3. Dengan ini, kelas Tailwind seperti `text-primary` dan `bg-primary` akan mengacu pada warna yang sama dengan `var(--primary)` di Vanilla CSS

---

## Sprint 3 — Refactoring Arsitektur `App.tsx` [COMPLETED]
**Estimasi:** 3–4 hari kerja  
**Status:** ✅ Selesai (07 Juni 2026)
**Prioritas:** 🔴 Harus selesai sebelum menambah fitur apapun

### Tujuan Sprint
Memecah `App.tsx` (1.456 baris) menjadi komponen-komponen yang terpisah, terarah, dan mudah di-maintain.

---

### Task 3.1 — Buat Struktur Folder Baru

**Struktur yang dituju:**
```
src/
├── components/
│   ├── Sidebar.tsx          (NEW) — navigasi sidebar
│   ├── UpgradeModal.tsx     (NEW) — modal upgrade plan
│   ├── MarkdownRenderer.tsx (NEW) — komponen ReactMarkdown + custom components
│   ├── LandingPage.tsx      (EXISTING)
│   ├── LegalDocs.tsx        (EXISTING)
│   └── AboutUs.tsx          (EXISTING)
├── pages/
│   ├── AuthPage.tsx         (EXISTING)
│   └── dashboard/
│       ├── AsuhanPage.tsx   (NEW) — form + hasil Asuhan Kefarmasian
│       ├── SkriningPage.tsx (NEW) — form + hasil Skrining Resep
│       ├── RiwayatPage.tsx  (NEW) — halaman riwayat + filter
│       └── PengaturanPage.tsx (NEW) — profil + langganan
├── services/
│   ├── aiService.ts         (MODIFIED) — sekarang hanya memanggil Edge Function
│   └── supabase.ts          (EXISTING)
├── store/
│   └── usePharmacyStore.ts  (EXISTING)
├── hooks/
│   └── useSpeechRecognition.ts (NEW) — ekstrak logika speech dari App.tsx
├── utils/
│   ├── imageUtils.ts        (NEW) — fungsi resizeImage()
│   └── markdownUtils.ts     (NEW) — fungsi cleanMarkdown()
├── App.tsx                  (TRIMMED) — hanya routing dan layout shell
└── main.tsx                 (EXISTING)
```

---

### Task 3.2 — Ekstrak Utility Functions
**File baru:** `src/utils/imageUtils.ts`, `src/utils/markdownUtils.ts`

**Langkah:**
1. Pindahkan fungsi `resizeImage()` dari `App.tsx` ke `src/utils/imageUtils.ts`
2. Pindahkan fungsi `cleanMarkdown()` dan `extractText()` ke `src/utils/markdownUtils.ts`
3. Import kembali di file yang membutuhkannya

---

### Task 3.3 — Ekstrak Custom Hook
**File baru:** `src/hooks/useSpeechRecognition.ts`

**Langkah:**
1. Pindahkan state `isListening` dan fungsi `toggleSpeechRecognition()` ke custom hook `useSpeechRecognition()`
2. Hook ini menerima callback `onResult: (transcript: string) => void`
3. Import dan gunakan di `SkriningPage.tsx`

---

### Task 3.4 — Buat Komponen `MarkdownRenderer`
**File baru:** `src/components/MarkdownRenderer.tsx`

**Langkah:**
1. Pindahkan `MarkdownComponents` object (custom blockquote renderer dengan icon KRITIS/PERINGATAN/SARAN) ke komponen terpisah
2. Komponen menerima prop `content: string`
3. Digunakan baik di `AsuhanPage.tsx` maupun `SkriningPage.tsx`

---

### Task 3.5 — Buat `Sidebar` Component
**File baru:** `src/components/Sidebar.tsx`

**Langkah:**
1. Ekstrak seluruh JSX sidebar dari `App.tsx` (baris ~464-517) ke komponen terpisah
2. Props: `activeTab`, `onNavigate`, `isMobileOpen`, `onCloseMobile`, `onSignOut`

---

### Task 3.6 — Buat `UpgradeModal` Component
**File baru:** `src/components/UpgradeModal.tsx`

**Langkah:**
1. Ekstrak JSX dan logika `handlePayment()` dari `App.tsx` ke komponen terpisah
2. Props: `isOpen`, `onClose`, `tier`

---

### Task 3.7 — Buat Page Components
**File baru:** `src/pages/dashboard/AsuhanPage.tsx`, `SkriningPage.tsx`, `RiwayatPage.tsx`, `PengaturanPage.tsx`

**Langkah per page:**
1. **`AsuhanPage.tsx`**: Seluruh form konsultasi (baris 543-682 di App.tsx) + state lokal form + handler `handleAnalysis`
2. **`SkriningPage.tsx`**: Form skrining (baris 684-900) + state lokal + handler screening + `useSpeechRecognition` hook
3. **`RiwayatPage.tsx`**: Halaman riwayat (baris 902-1068) + filter logic `filteredConsultations`, `filteredScreenings`
4. **`PengaturanPage.tsx`**: Settings (baris 1070-1336) + `handleUpdateProfile` + `settingsSubTab` state

---

### Task 3.8 — Trim `App.tsx` menjadi Shell
**File:** `src/App.tsx`

Setelah semua komponen diekstrak, `App.tsx` hanya berisi:
1. `AppWrapper` — logika inisialisasi session Supabase
2. `ProtectedRoute` — komponen guard
3. `MainApp` — layout shell (sidebar + `<Outlet>`) dengan `<Routes>` yang mengarah ke page components
4. Target ukuran akhir: **< 100 baris**

---

## Sprint 4 — Backend Hardening & Polish
**Estimasi:** 2–3 hari kerja  
**Prioritas:** ⚠️ Sebelum peluncuran publik penuh / kampanye akuisisi user

### Tujuan Sprint
Memindahkan validasi bisnis yang kritis ke backend, dan memastikan tidak ada celah logika yang bisa dieksploitasi.

---

### Task 4.1 — Validasi Tier Limit di Backend
**Temuan:** Sedang #2 — Tier authorization hanya di frontend  
**File:** Edge Function baru atau `supabase/functions/analyze-*/index.ts`

**Langkah:**
1. Di dalam Edge Function AI (yang dibuat di Sprint 1), tambahkan logika pengecekan:
   - Query tabel `usage_logs` untuk menghitung dokumen bulan ini
   - Query tabel `subscriptions` untuk cek `status` dan `expired_at`
   - Jika user Free dan sudah >= 15 dokumen → kembalikan error `429` dengan message yang jelas
2. Frontend tetap menampilkan `checkLimit()` sebagai UX cepat (agar modal muncul sebelum request terkirim), tapi backend adalah garis pertahanan yang sesungguhnya

---

### Task 4.2 — Perbaiki Logika Penentuan Tier
**Temuan:** Sedang #5 — Tier dari user_metadata, bukan dari DB subscriptions  
**File:** `src/App.tsx` (`AppWrapper`), `src/store/usePharmacyStore.ts`, Edge Function baru

**Langkah:**
1. Buat Edge Function `get-user-status` yang:
   - Menerima request dengan `access_token` user
   - Query `subscriptions` WHERE `user_id = auth.uid()` AND `status = 'active'` AND `expired_at > NOW()`
   - Return `{ tier: 'pro' | 'free' }`
2. Di `AppWrapper`, panggil `get-user-status` setelah session terdeteksi untuk mendapatkan tier aktual
3. Simpan tier ke Zustand store seperti sebelumnya

---

### Task 4.3 — Tambahkan RLS Policy DELETE untuk `usage_logs`
**Temuan:** Sedang #7  
**File:** `supabase_schema.sql`, Supabase Dashboard

**Langkah:**
1. Tambahkan komentar di `supabase_schema.sql` yang menjelaskan secara eksplisit bahwa tidak ada DELETE policy di `usage_logs` adalah disengaja untuk keperluan audit trail
2. Jika di kemudian hari diperlukan, tambahkan `DELETE` policy hanya untuk admin role

---

### Task 4.4 — Final QA & Regression Testing
**Langkah:**
1. Test alur login → dashboard → asuhan → skrining → riwayat → pengaturan → logout
2. Test flow upgrade: user Free melebihi limit → modal muncul → Midtrans → tier berubah
3. Test di mobile (responsive)
4. Verifikasi gambar landing page tampil dengan benar
5. Cek Network tab di DevTools — pastikan tidak ada API key yang terlihat di request headers atau response body

---

## Ringkasan Timeline

| Sprint | Fokus | Durasi | Gate (Kriteria Selesai) |
|---|---|---|---|
| **Sprint 1** | Keamanan & Quick Fixes | 2–3 hari | API key tidak terlihat di browser DevTools |
| **Sprint 2** | Resolusi CSS | 2–3 hari | `npm run build` sukses, LandingPage tampil normal |
| **Sprint 3** | Refactoring App.tsx | 3–4 hari | `App.tsx` < 100 baris, semua fitur tetap berfungsi |
| **Sprint 4** | Backend Hardening | 2–3 hari | Limit tier tidak bisa di-bypass dari browser |
| **Total** | | **~2 Minggu** | Siap untuk kampanye akuisisi user pertama |

---

## Catatan untuk Solo Founder

> **Jangan tunda Sprint 1.** API Key yang terekspos adalah risiko finansial nyata — satu bot yang menemukan key Anda bisa menguras kredit Sumopod dalam hitungan menit.
>
> **Sprint 3 bisa dikerjakan bertahap.** Pecah satu page component per hari. Mulai dari yang paling kecil (`PengaturanPage`) lalu naik ke yang paling kompleks (`AsuhanPage`).
>
> **Sprint 4 bisa diundur** jika Anda belum ada paying user. Prioritaskan Sprint 1–2 terlebih dahulu, lalu mulai kampanye beta, baru kerjakan Sprint 3–4 seiring dengan onboarding user pertama.

---

*Dokumen ini adalah living document — perbarui status setiap task seiring progress pengerjaan.*
