💊 FarmasiKu

Product Development Master Plan

Skrining Farmasi & CPPT Cerdas untuk Puskesmas Indonesia

Versi 1.0  •  Maret 2026  •  Konfidensial

  PLAN 1 — PENGEMBANGAN FITUR  

Feature Development Plan

Dokumen ini menjabarkan fitur-fitur inti FarmasiKu beserta output, threshold, dan prioritas pengembangannya.

Fitur 1 — Skrining Cepat

Tagline: Cek resep dalam 30 detik

Input

Nama obat, dosis, dan aturan pakai

Bisa diinput via ketik manual

Upload foto resep (Phase 3)

Input suara (Phase 3)

Output — Format 4T 1W

Threshold Skrining Cepat

Fitur 2 — Pharmacist Care Plan

Tagline: Dokumentasi klinis lengkap, sekali proses

Input Form (Terstruktur)

Output — Pharmacist Care Plan

1. Ringkasan identitas & konteks pasien

2. Hasil Skrining ringkasan 4T1W

3. SOAP Farmasi lengkap (S, O, A, P)

4. Monitoring Plan — apa, kapan, indikator keberhasilan

5. Rekomendasi ke Dokter (jika ada DRP mayor)

6. CPPT ringkas — siap tanda tangan

7. Evidence Base — referensi Kemenkes, Stockley's, DiPiro

Threshold Pharmacist Care Plan

Fitur 3 — Riwayat Skrining

Tagline: Semua tercatat, mudah ditelusuri

List semua skrining & care plan yang pernah dibuat

Filter by tanggal, nama pasien, dan level flag

Buka ulang & edit dokumen lama

Export PDF per pasien (Pro only)

Threshold Riwayat per Tier

Fitur 4 — Pengaturan

Profil apoteker — nama, SIPA, nama puskesmas

Preferensi output — bahasa formal atau semi-formal

Kelola langganan & upgrade plan

Prioritas Development

  PLAN 2 — MODEL BISNIS  

Business Plan

Rencana bisnis FarmasiKu sebagai produk SaaS B2C yang menyasar apoteker puskesmas di Indonesia.

Target User

Apoteker (Apoteker Penanggung Jawab) di puskesmas Indonesia

1 puskesmas = 1 apoteker — model per-seat individual, bukan institusi

Pain point utama: skrining resep tidak konsisten & CPPT manual yang menyita waktu

Motivasi bayar: tekanan akreditasi FKTP + beban dokumentasi harian

Unfair Advantage

Founder adalah apoteker puskesmas aktif — deep domain knowledge & insider credibility

Output sudah tervalidasi oleh beta user: 'memudarkan kebingungan'

Distribusi via komunitas apoteker online — zero ad spend

Pricing Structure

Logika Pricing

Di bawah psychological barrier Rp 100.000 — keputusan individual, bukan anggaran kantor

Free tier cukup buat 2-3 hari kerja — user merasakan manfaat sebelum limit habis

Download PDF sebagai conversion trigger utama — CPPT harus ada fisiknya untuk rekam medis

Unit Economics

Simulasi Profitabilitas per User Pro

Catatan: Margin di atas 85% di semua skenario realistis. Model bisnis sangat sustainable.

Go-to-Market Strategy

Phase 1 — Bangun Kredibilitas (Bulan 1-2)

Masuk grup WA / Telegram komunitas apoteker puskesmas

Sharing konten edukatif: tips CPPT, format skrining, update regulasi

Posisikan diri sebagai sesama apoteker yang ngerti masalahnya

Phase 2 — Soft Launch Beta (Bulan 2-3)

Rekrut 10-20 apoteker beta user secara personal

Gratis penuh, minta feedback jujur

Kumpulkan testimoni & cerita sukses spesifik

Phase 3 — Konten sebagai Distribusi (Bulan 3+)

Buat konten edukatif di TikTok / Instagram / YouTube

Topik: cara nulis CPPT yang benar, checklist skrining resep, tutorial FarmasiKu

Konten edukatif dulu — produk disebut sekilas, bukan hard sell

Revenue Target

  PLAN 3 — TECHNICAL PLAN  

Technical Development Plan

Roadmap teknis FarmasiKu dari kondisi MVP saat ini hingga siap launch dan scale.

Tech Stack

Phase 1 — Foundation (Minggu 1-4)

Blocker utama sebelum bisa onboard user mandiri.

Minggu 1-2: Authentication

Setup Supabase project (auth + database)

Halaman Register — email, password, nama, SIPA, nama puskesmas

Halaman Login — email & password + Google OAuth

Protected routes — redirect ke login jika belum auth

Minggu 3: Usage Tracking & Tier System

Tabel users di Supabase — id, email, tier (free/pro), created_at

Tabel usage — user_id, type (skrining/care_plan), created_at

Logic limit: free tier block di angka 15 dokumen/bulan

Upgrade prompt — muncul saat limit tercapai

Minggu 4: Payment Integration

Setup akun Midtrans (sandbox dulu)

Integrasi Midtrans Snap di frontend

Webhook Midtrans → update tier di Supabase

Halaman subscription status

Phase 2 — Monetisasi (Setelah Ada Paying User)

Export PDF — react-pdf untuk generate dokumen Care Plan siap print

Halaman riwayat — list, filter tanggal, filter level flag, search nama pasien

Email notifikasi — welcome email, reminder limit hampir habis, konfirmasi pembayaran

Profil user — edit nama, SIPA, nama puskesmas

Phase 3 — Scale

Input foto resep — OCR via Gemini Vision (sudah tersedia di Sumopod)

Input suara — Whisper API via Sumopod

Admin panel — Supabase Table Editor cukup untuk 0-50 user, build custom setelah itu

Analytics dashboard — revenue, active users, dokumen per hari

Database Schema (Minimal)

Prinsip Development untuk Solo Founder

Jangan build Phase 3 sebelum ada 5 paying user

Gunakan tools yang sudah ada: Supabase dashboard untuk admin, Midtrans dashboard untuk transaksi

Satu model AI untuk semua tier — jangan kompromiin akurasi klinis demi hemat cost

Validasi dulu, polish kemudian — user pertama lebih penting dari fitur tambahan

Ringkasan Timeline

Status | Poin | Keterangan

✅ / ⚠️ / 🔴 | Tepat Indikasi | Kesesuaian obat dengan diagnosis

✅ / ⚠️ / 🔴 | Tepat Obat | Pilihan obat sesuai guideline

✅ / ⚠️ / 🔴 | Tepat Dosis | Dosis sesuai BB, usia, fungsi ginjal

✅ / ⚠️ / 🔴 | Tepat Pasien | Kontraindikasi individual

✅ / ⚠️ / 🔴 | Waspada | Interaksi obat & efek samping

Level | Kondisi | Tampilan | Aksi

✅ Aman | Tidak ada masalah ditemukan | Hijau — status saja | Generate normal

⚠️ Perhatian | Perlu monitoring atau penyesuaian | Kuning + narasi singkat | Tambah catatan monitoring

🔴 Kritis | Interaksi berbahaya / kontraindikasi | Merah + rekomendasi tindakan | Muncul alert wajib baca

Field | Tipe | Wajib?

Nama Pasien / No. RM | Text | Opsional

Umur | Number (tahun) | Ya

Berat Badan | Number (kg) | Ya

Diagnosis Utama | Text | Ya

Riwayat Alergi | Text | Opsional

Daftar Obat + Dosis | Text area | Ya

Subjective (S) | Text area — poin keluhan | Ya

Objective (O) | Text area — data vital/lab | Ya

Level | Kondisi | Aksi Sistem

✅ Optimal | Semua aman, sesuai guideline | Generate normal

⚠️ DRP Minor | Dosis perlu monitor, efek samping ringan | Tambah monitoring plan spesifik

🔴 DRP Mayor | Interaksi berbahaya, kontraindikasi absolut | Auto-generate rekomendasi ke dokter

Tier | Batas Riwayat | Export PDF

Free | 30 hari terakhir | Tidak

Pro | 1 tahun | Ya

Phase | Timeline | Fitur

Phase 1 | Sekarang → Launch | Polish output 4T1W + Restructure Care Plan output

Phase 2 | Setelah paying user | Riwayat filter & search + Export PDF proper

Phase 3 | Scale | Input foto & suara + Admin analytics

Tier | Harga | Limit | Fitur Kunci

Free | Rp 0 / bulan | 15 dokumen/bulan | Skrining + Care Plan, tanpa download

Pro | Rp 79.000 / bulan | Unlimited | Semua fitur + Download PDF + Riwayat 1 tahun

Model AI | Use Case | Cost per Dokumen | Keterangan

Gemini 2.5 Flash | Skrining Cepat | ~Rp 36 | Cepat, efisien, cukup akurat

Gemini 2.5 Flash | Care Plan | ~Rp 36-80 | Default model utama

Gemini 2.5 Pro | Care Plan kompleks | ~Rp 140 | Upgrade jika ada komplain akurasi

Skenario | Dokumen/Bulan | Cost AI | Revenue | Margin

Pemakaian ringan | 50 dok | ~Rp 2.500 | Rp 79.000 | ~97%

Pemakaian normal | 100 dok | ~Rp 5.000 | Rp 79.000 | ~94%

Pemakaian berat | 200 dok | ~Rp 10.000 | Rp 79.000 | ~87%

Milestone | Target User Pro | MRR | Timeline

Early traction | 10 user | Rp 790.000 | Bulan 3-4

Initial growth | 50 user | Rp 3.950.000 | Bulan 6

Sustainable | 100 user | Rp 7.900.000 | Bulan 9-12

Scale | 300 user | Rp 23.700.000 | Tahun 2

Layer | Teknologi | Alasan

Frontend | React / Next.js | Sudah ada, tidak perlu migrasi

Auth | Supabase Auth | Gratis, integrasi mudah ke Next.js, support Google login

Database | Supabase (PostgreSQL) | Gratis tier cukup untuk awal, real-time ready

AI Provider | Sumopod → Gemini 2.5 Flash | Cost efisien, akurasi cukup untuk klinis

Payment | Midtrans Snap | Paling mudah untuk solo founder, support QRIS + transfer

Email | Resend | Gratis 3.000 email/bulan, developer-friendly

PDF Export | react-pdf / Puppeteer | Phase 2 — setelah ada paying user

Task | Estimasi | Status

Setup Supabase Auth | 2 hari | Belum

Halaman Register / Login | 2 hari | Belum

Protected routes | 1 hari | Belum

Usage tracking system | 2 hari | Belum

Free tier limit + prompt | 1 hari | Belum

Integrasi Midtrans | 3 hari | Belum

Webhook & tier update | 2 hari | Belum

Tabel | Field Utama | Keterangan

users | id, email, name, sipa, puskesmas, tier, created_at | Data user & status langganan

usage_logs | id, user_id, type, created_at | Tracking penggunaan per bulan

documents | id, user_id, type, input_data, output_data, created_at | Riwayat dokumen

subscriptions | id, user_id, midtrans_id, status, expired_at | Data langganan & pembayaran

Phase | Fokus | Target Selesai | Gate

Phase 1 | Auth + Usage + Payment | Minggu 4 | Bisa onboard user mandiri

Soft Launch | Cari 10 paying user | Bulan 2 | Ada revenue pertama

Phase 2 | PDF + Riwayat + Email | Bulan 3-4 | Retention meningkat

Phase 3 | Foto + Suara + Analytics | Bulan 6+ | 100+ user aktif