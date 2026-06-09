# Implementation Plan: Refactoring FarmasiKu menjadi Platform MTM

Dokumen ini menjabarkan rencana teknis untuk mengubah paradigma FarmasiKu dari sekadar "generator CPPT insidental" menjadi **Platform Medication Therapy Management (MTM)** yang komprehensif untuk Apoteker.

Transformasi ini akan mengintegrasikan 5 pilar MTM:
1. **MTR (Medication Therapy Review)**: Skrining klinis mendalam berbasis AI.
2. **PMR (Personal Medication Record)**: Basis data rekam medis pengobatan pasien yang longitudinal (berkelanjutan).
3. **MAP (Medication-Related Action Plan)**: Rencana aksi untuk pasien (bahasa awam).
4. **Intervensi/Rujukan**: Rekomendasi klinis untuk dokter jika ada temuan kritis.
5. **Dokumentasi (CPPT/SOAP)**: Bukti rekam medis resmi untuk arsip Puskesmas.

## Status Pengerjaan (Updated)
Sebagian besar fondasi arsitektur MTM telah **SELESAI** dikerjakan, meliputi integrasi database, pembuatan halaman pasien, dan penyusunan antarmuka *timeline* rekam medis yang adaptif.

## Keputusan Desain & Strategi
1. **Penyederhanaan Menu (SELESAI):** Menu `/asuhan` dan `/skrining` telah dilebur menjadi satu menu utama bernama **`/mtm`** (Pasien & MTM) karena skrining merupakan bagian dari MTR.
2. **Sistem Token/Pricing (PENDING):** Optimasi token per *tier* akan disesuaikan di fase berikutnya. Saat ini fokus pada fungsionalitas utama aplikasi.

## Proposed Changes

### 1. Database Schema Update (Supabase) [SELESAI]

Kita telah beralih ke skema relasional yang berpusat pada entitas Pasien dan Sesi MTM.

#### `patients`
Tabel untuk menyimpan data dasar Personal Medication Record (PMR).
- `id` (UUID, PK)
- `user_id` (FK to auth.users - Apoteker)
- `name`, `no_rm`, `dob`, `gender`
- `allergies`, `chronic_diseases`
- `created_at`

#### `mtm_sessions`
Tabel untuk mencatat setiap sesi pelayanan MTM.
- `id` (UUID, PK)
- `patient_id` (FK to patients)
- `user_id` (FK to auth.users)
- `session_date` (Timestamp)
- `clinical_data` (JSONB) -> Input: Tensi, Nadi, Keluhan (S & O).
- `medications_data` (JSONB) -> Input: Daftar obat yang sedang/akan diresepkan.
- `mtr_result` (JSONB)
- `cppt_result` (JSONB)
- `map_result` (JSONB)

### 2. Perubahan UI/UX (Frontend) [SELESAI]

Perombakan antarmuka untuk mendukung *workflow* yang baru.

#### `src/App.tsx` & Sidebar
- Rute navigasi diperbarui untuk menghilangkan halaman asuhan/skrining lama dan fokus ke `/mtm`.

#### `src/pages/dashboard/PatientsPage.tsx`
- Halaman daftar pasien telah menggunakan data *real* dari database.
- Terdapat fungsi *Search* dan form modal fungsional untuk "Tambah Pasien".

#### `src/pages/dashboard/PatientProfilePage.tsx`
- Menampilkan riwayat alergi, penyakit kronis, dan informasi demografi pasien.
- **[FITUR BARU] Accordion Timeline:** Riwayat Sesi MTM divisualisasikan menggunakan struktur *timeline* vertikal interaktif yang dikelompokkan berdasarkan **Bulan dan Tahun**.
  - Mengatasi masalah visual *clutter* ketika pasien memiliki riwayat rawat inap (*multiple admissions*) yang berjauhan.
  - Menggunakan animasi *CSS Grid Transition* (`grid-template-rows`) untuk efek lipat (*smooth slide-down accordion*) secara natural tanpa mengubah semantik React secara berlebihan.
  - Blok bulan terbaru (paling atas) akan terbuka secara otomatis (*auto-expanded*).
- Tombol aksi utama: **"Mulai Sesi MTM Baru"**.

#### `src/pages/dashboard/MTMSessionPage.tsx`
- Mengambil parameter `patientId` dan `sessionId` (jika mode lihat riwayat).
- Mengintegrasikan form *input* klinis dengan *state* lokal sebelum dikirimkan ke AI Edge Function.
- Menggunakan `MarkdownRenderer` untuk merender hasil `mtr_result`, `cppt_result`, dan `map_result`.

### 3. Modifikasi AI Service Layer (Backend/Integrasi Gemini) [SELESAI]

#### `supabase/functions/analyze-mtm` & `src/services/aiService.ts`
- **Longitudinal Context Injection**: Sistem kini mengambil data dari sesi *sebelumnya* (jika ada) dan menyisipkan `cppt_result` ke dalam *prompt* sistem sebagai histori. Hal ini memungkinkan model AI memahami kronologi perkembangan pasien hari per hari (Visite Hari ke-1, Hari ke-2, dst).
- **Multi-Output Prompting**: Edge Function kini meminta dan mem-parsing *response* Gemini ke dalam JSON berstruktur pasti (`mtr_result`, `cppt_result`, `map_result`).

## Verification Plan & Next Steps

### Langkah Verifikasi Lanjutan
1. **Deploy Edge Function [SELESAI]:** Edge Function terbaru `analyze-mtm` telah sukses di-deploy ke _cloud_ Supabase untuk melayani *endpoint* AI terpusat.
2. **Pricing Policy / Optimasi Token:** Menyusun rencana struktur penggunaan *tokens* per akun, dikarenakan beban kerja AI yang meningkat dalam satu kali Sesi MTM.
