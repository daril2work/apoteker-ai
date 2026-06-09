# 🔍 Code Audit Report — FarmasiKu
**Tanggal Audit:** 06 Juni 2026  
**Versi Produk:** 1.03.04.6  
**Auditor:** Antigravity AI  
**Scope:** Seluruh source code di direktori `src/` + schema database + konfigurasi

---

## Ringkasan Eksekutif

Kodebase FarmasiKu dalam kondisi **fungsional namun berisiko tinggi** untuk dilanjutkan tanpa *refactoring*. Terdapat **1 celah keamanan kritikal** yang sudah terekspos ke publik jika di-deploy, **1 masalah arsitektur berat** yang akan menjadi utang teknis besar, dan beberapa inkonsistensi minor yang bisa dibiarkan untuk sekarang.

**Verdict:** ✅ Produk bisa berjalan | ⚠️ Tapi butuh 2 perbaikan penting sebelum scale

---

## 1. Inventaris File

| File | Ukuran | Status |
|---|---|---|
| `src/App.tsx` | 69KB / 1.456 baris | 🔴 Terlalu besar |
| `src/pages/AuthPage.tsx` | 19KB / 443 baris | ✅ Wajar |
| `src/components/LandingPage.tsx` | 30KB / 469 baris | ⚠️ Agak besar |
| `src/components/LegalDocs.tsx` | 7.7KB | ✅ OK |
| `src/components/AboutUs.tsx` | 4.2KB | ✅ OK |
| `src/store/usePharmacyStore.ts` | 7.2KB / 186 baris | ⚠️ Ada catatan |
| `src/services/aiService.ts` | 3.8KB / 112 baris | 🔴 Risiko keamanan |
| `src/services/supabase.ts` | 372B | ✅ OK |
| `src/index.css` | 18KB / 880 baris | ⚠️ Lihat catatan |
| `supabase_schema.sql` | 2.3KB | ✅ Bagus |
| `.env` | 97B | 🔴 **KONFIRMASI KRITIS** |

---

## 2. Temuan Keamanan (Security)

### 🔴 KRITIS #1 — API Key AI Terekspos di Frontend

**File:** `src/services/aiService.ts` (baris 3-4) + `.env` (baris 1)

**Bukti langsung dari kode:**
```typescript
// aiService.ts
export const defaultApiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
export const defaultBaseURL = import.meta.env.VITE_SUMOPOD_BASE_URL;
```

```env
# .env
VITE_SUMOPOD_API_KEY=sk-KRw11Bg8NthuVw31dJfilg
VITE_SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
```

**Mengapa ini berbahaya:** Semua variabel dengan prefix `VITE_` dimasukkan **secara literal** ke dalam bundle JavaScript oleh Vite saat build. Siapapun yang mengakses situs dan membuka DevTools → Sources atau Network tab bisa melihat key ini. Key tersebut bisa digunakan orang lain untuk memanggil Sumopod/Gemini atas tanggungan biaya akun Anda.

**Dampak nyata:** Jika satu pengguna nakal menemukan key ini, mereka bisa melakukan ribuan permintaan AI yang ditagihkan ke akun Sumopod Anda → kerugian finansial langsung.

**Solusi yang direkomendasikan:**
1. **Jangka pendek (hari ini):** Pindahkan semua logika `analyzeConsultation` dan `analyzePrescription` ke dalam Supabase Edge Function. Frontend cukup memanggil endpoint Edge Function, bukan Sumopod langsung.
2. **Jangka panjang:** Simpan key di environment variable Supabase (server-side), bukan di `.env` frontend.

---

### ⚠️ SEDANG #2 — Tier Authorization Hanya di Frontend

**File:** `src/App.tsx` (baris 121-127), `src/store/usePharmacyStore.ts`

**Bukti dari kode:**
```typescript
// App.tsx - checkLimit function
const checkLimit = () => {
  if (tier === 'free' && usageCountThisMonth >= 15) {
    setShowUpgradeModal(true);
    return false;
  }
  return true;
};
```

**Masalah:** Logika pembatasan 15 dokumen/bulan hanya diterapkan di browser. Seorang pengguna teknis bisa dengan mudah men-*disable* cek ini lewat browser console, atau memanggil Supabase Edge Function langsung untuk menyimpan dokumen tanpa batas.

**Catatan:** Ini bukan masalah kritikal untuk MVP/beta, tapi harus diperbaiki sebelum peluncuran publik penuh. Validasi limit harus juga ada di backend (Edge Function atau Supabase RLS/trigger).

---

### ✅ BAIK — Supabase Row Level Security (RLS) Sudah Aktif

**File:** `supabase_schema.sql` (baris 32-52)

Skema database sudah mengaktifkan RLS dengan benar pada semua tabel (`usage_logs`, `documents`, `subscriptions`). Setiap user hanya bisa membaca/menulis data milik mereka sendiri. Ini adalah praktik yang benar.

---

## 3. Arsitektur & Kualitas Kode

### 🔴 KRITIS #3 — `App.tsx` adalah Monolith (1.456 baris)

**File:** `src/App.tsx`

Ini adalah masalah arsitektur terbesar. Seluruh aplikasi dashboard (4 halaman + sidebar + modal + logika pembayaran + audio recording + image resizing) ditumpuk dalam satu file. Rincian apa saja yang ada di dalamnya:

| Tanggung Jawab | Lokasi di App.tsx |
|---|---|
| Layout sidebar + navigasi | Baris ~445-517 |
| Form Asuhan Kefarmasian (input + submit) | Baris ~543-682 |
| Form Skrining Resep (input + kamera + suara) | Baris ~684-900 |
| Halaman Riwayat + filter | Baris ~902-1068 |
| Halaman Pengaturan + Profil + Langganan | Baris ~1070-1336 |
| Modal Upgrade | Baris ~1340-1363 |
| Print CSS inline | Baris ~1365-1396 |
| Auth state management (`AppWrapper`) | Baris ~1401-1445 |
| Protected Route | Baris ~1447-1453 |

**Dampak konkret:**
- Setiap kali komponen manapun me-*render*, React harus menelusuri seluruh 1.456 baris
- Sangat sulit menambah fitur baru tanpa risiko merusak hal lain
- Tidak bisa melakukan *code splitting* untuk performa

---

### ⚠️ SEDANG #4 — Inkonsistensi Sistem CSS (Vanilla CSS vs Tailwind)

**File:** `src/components/LandingPage.tsx` vs `src/App.tsx`/`src/pages/AuthPage.tsx`

`LandingPage.tsx` menggunakan **Tailwind CSS class names** secara masif (misalnya `className="max-w-7xl mx-auto px-8 h-16 flex justify-between items-center"`), sementara `App.tsx` dan `AuthPage.tsx` menggunakan **Vanilla CSS classes** yang didefinisikan di `index.css` (misalnya `className="card"`, `className="btn-primary"`).

**Bukti:**
```tsx
// LandingPage.tsx — TAILWIND
<div className="max-w-7xl mx-auto px-8 h-16 flex justify-between items-center">

// App.tsx — VANILLA CSS
<div className="card">
<button className="btn-primary">
```

**Masalah:** Tailwind **tidak terdaftar sebagai dependency** di `package.json`. Kelas-kelas Tailwind di LandingPage hanya berfungsi karena kebetulan nama kelasnya ada di CSS global atau karena browser mengabaikannya. Ini bisa menyebabkan tampilan LandingPage kacau secara tidak terduga.

**Rekomendasi:** Pilih satu pendekatan: install dan konfigurasi Tailwind dengan benar, atau konversi LandingPage ke Vanilla CSS seperti halaman lainnya.

---

### ⚠️ SEDANG #5 — Tier `pro` Diambil dari User Metadata, Bukan Database Subscriptions

**File:** `src/App.tsx` (baris 1408), `src/store/usePharmacyStore.ts` (baris 54)

**Bukti dari kode:**
```typescript
// AppWrapper di App.tsx
if (session?.user?.user_metadata?.tier) setTier(session.user.user_metadata.tier);
```

Tier user diambil dari `user_metadata` Supabase Auth, bukan dari tabel `subscriptions`. Ini berarti:
1. Webhook Midtrans harus mengupdate `user_metadata` (bukan hanya tabel `subscriptions`) agar tier berubah
2. Tidak ada cross-check antara `subscriptions.expired_at` dan `user_metadata.tier`
3. User Pro yang sudah expired tetap terlihat sebagai Pro sampai metadata diupdate manual

**Rekomendasi:** Logika penentuan tier sebaiknya dilakukan di server (Edge Function) yang mengecek tabel `subscriptions.expired_at`, lalu hasilnya dikirim ke frontend.

---

### 💡 OBSERVASI #6 — `loadUserData()` Dipanggil Dua Kali

**File:** `src/App.tsx` (baris 1409 & 1416)

```typescript
// Dipanggil dua kali: satu saat getSession(), satu saat onAuthStateChange()
if (session?.user) usePharmacyStore.getState().loadUserData(); // baris 1409
// ...
if (session?.user) usePharmacyStore.getState().loadUserData(); // baris 1416
```

Saat aplikasi pertama kali dimuat, `loadUserData()` akan dipanggil dua kali (sekali dari `getSession()` dan sekali dari `onAuthStateChange`), yang berarti dua query ke Supabase yang identik setiap kali halaman dimuat.

---

### ✅ BAIK — Protected Routes Sudah Benar

**File:** `src/App.tsx` (baris 1447-1453)

`ProtectedRoute` component sudah diimplementasikan dengan benar — memvalidasi dari Zustand store apakah ada user yang aktif sebelum mengizinkan akses ke halaman dashboard.

---

### ✅ BAIK — Error Handling di AuthPage

**File:** `src/pages/AuthPage.tsx` (baris 131)

Error message Supabase yang teknis (`"Invalid login credentials"`) sudah di-*translate* ke bahasa Indonesia yang ramah pengguna:
```typescript
error === 'Invalid login credentials' ? 'Email atau kata sandi tidak sesuai.' : error
```

---

### ✅ BAIK — Image Resizing Sebelum Upload

**File:** `src/App.tsx` (baris 282-309)

Fungsi `resizeImage()` sudah ada dan akan memotong ukuran gambar ke maksimal 1024px sebelum dikirim ke API, menghemat biaya token AI.

---

## 4. Database & Schema

### ✅ BAIK — Schema Sudah Benar Secara Struktural

Tabel `usage_logs`, `documents`, dan `subscriptions` sudah sesuai dengan rencana di `farmasiku-plan.md`.

### ⚠️ SEDANG #7 — Tidak Ada RLS DELETE Policy untuk `usage_logs`

**File:** `supabase_schema.sql` (baris 37-39)

`usage_logs` hanya punya policy `SELECT` dan `INSERT`, tidak ada `DELETE`. Ini disengaja untuk audit trail, tapi perlu didokumentasikan dengan jelas agar tidak dianggap sebagai bug di kemudian hari.

---

## 5. Performa & UX

### ⚠️ SEDANG #8 — Gambar Aset LandingPage Bisa 404

**File:** `src/components/LandingPage.tsx` (baris 145, 187, 310)

LandingPage memanggil tiga gambar statis:
```tsx
src="/hero-mockup.png"
src="/dashboard-mockup.png"  
src="/ebm-algorithm.png"
```

Gambar-gambar ini harus ada di folder `public/`. Jika tidak ada, akan ada broken image di landing page yang bisa merusak kepercayaan calon pengguna pertama.

---

### 💡 OBSERVASI #9 — Duplikasi Animasi `animate-spin` CSS

**File:** `src/App.tsx` (baris 1365-1368, 1426-1427)

Style `animate-spin` didefinisikan dua kali secara inline (`<style>` tags) di `App.tsx`, padahal bisa cukup sekali di `index.css`.

---

## 6. Prioritas Aksi (Action Plan)

| No | Temuan | Prioritas | Estimasi |
|---|---|---|---|
| 1 | **Pindahkan API Key AI ke Edge Function** | 🔴 Lakukan Sekarang | 1-2 hari |
| 2 | **Pecah App.tsx menjadi page components** | 🔴 Sebelum Scale | 2-3 hari |
| 3 | **Pilih satu sistem CSS (Tailwind atau Vanilla)** | ⚠️ Segera | 1 hari |
| 4 | **Validasi tier di backend** | ⚠️ Sebelum launch publik | 1 hari |
| 5 | **Perbaiki double `loadUserData()` call** | 💡 Minor | 15 menit |
| 6 | **Pastikan gambar aset public/ ada** | ⚠️ Sebelum live | 30 menit |

---

*Laporan ini dihasilkan berdasarkan pembacaan menyeluruh seluruh file source code pada 06 Juni 2026.*
