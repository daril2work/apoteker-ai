# 🛡️ Supabase Deployment Safety Guide

Dokumen ini berisi Standard Operating Procedure (SOP) dan langkah-langkah pencegahan untuk memastikan tidak ada kesalahan deployment atau kesalahan konfigurasi secrets ke project Supabase yang salah di masa depan.

---

## 🚨 Mengapa Insiden Terjadi?
Sebelumnya, Supabase CLI ter-link secara otomatis ke project `meso-app` (`utnzrnlekhrnrcimrvqr`) karena file konfigurasi lokal atau session login lama yang tersisa. Saat perintah deploy dijalankan tanpa verifikasi eksplisit, CLI langsung menargetkan project tersebut, menyebabkan kegagalan otorisasi atau perubahan tak disengaja pada project lain.

---

## 📋 Langkah Pencegahan (SOP Wajib)

### 1. Verifikasi Project Linked Sebelum Setiap Perintah Cloud
Sebelum menjalankan `supabase deploy` atau `supabase secrets set`, selalu jalankan perintah berikut untuk melihat project mana yang sedang aktif (ditandai dengan simbol `●`):
```powershell
supabase projects list
```
**Aturan Emas:** 
- Pastikan **REFERENCE ID** dari project yang aktif sama dengan domain di `VITE_SUPABASE_URL` pada file `.env` Anda.
- Jika domain `.env` Anda adalah `https://xyzabc.supabase.co`, maka project yang LINKED haruslah `xyzabc`.

### 2. Gunakan Konfigurasi Ter-pin (Pinning Project)
Jika Anda bekerja dengan banyak project, jangan mengandalkan link global atau default login. Anda bisa me-link project secara eksplisit per sesi kerja:
```powershell
supabase link --project-ref <REFERENCE-ID-FARMASIKU>
```
Gunakan perintah ini setiap kali Anda berpindah workspace atau setelah melakukan `supabase logout`.

### 3. Bersihkan Project meso-app
Jika meso-app tidak sengaja tersentuh:
- Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) -> pilih project `meso-app` -> Edge Functions. Hapus function `analyze-consultation` dan `analyze-screening` jika ada.
- Masuk ke Settings -> API -> Secrets, hapus `SUMOPOD_API_KEY` dan `SUMOPOD_BASE_URL` jika sempat masuk.

### 4. Tambahkan Check Guard pada Script Pembangunan/Deployment
Kita dapat menambahkan script validasi otomatis pada `package.json` sebelum melakukan deployment untuk memastikan targetnya benar, atau setidaknya mematikan auto-deploy tanpa konfirmasi eksplisit dari pengguna.

---

## 🛠️ Langkah Menghubungkan Project FarmasiKu yang Benar

1. Dapatkan **Project Reference ID** untuk FarmasiKu dari Supabase Dashboard (ada di URL browser saat membuka project Anda: `https://supabase.com/dashboard/project/<REF_ID>`).
2. Jalankan login ulang jika akun Supabase-nya berbeda:
   ```powershell
   supabase logout
   supabase login
   ```
3. Hubungkan project lokal ke FarmasiKu yang benar:
   ```powershell
   supabase link --project-ref <REF_ID_FARMASIKU>
   ```
4. Verifikasi ulang dengan `supabase projects list` sebelum deploy secrets atau Edge Functions.
