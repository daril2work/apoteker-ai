# 🎨 Laporan Hasil Sprint 2 — Resolusi Inkonsistensi CSS (FarmasiKu)

**Tanggal Penyelesaian:** 06 Juni 2026  
**Status Sprint:** ✅ Selesai (Sukses Terintegrasi & Bersih dari Warnings)

---

## 🛠️ Detail Perbaikan & Langkah yang Dilakukan

### Task 2.1 — Keputusan Arsitektur CSS
* **Keputusan:** Pilihan A (Install & Konfigurasi Tailwind secara resmi).
* **Alasan:** Landing page utama telah menggunakan ratusan baris utility class Tailwind. Menulis ulang seluruh landing page ke Vanilla CSS membutuhkan waktu yang tidak efisien. Konfigurasi resmi Tailwind memungkinkan kita mempertahankan landing page dengan mudah sembari memastikan tidak mengganggu styles Vanilla CSS di halaman dashboard lainnya.

### Task 2.2 — Install dan Konfigurasi Tailwind CSS
* **Tindakan:**
  * Menginstall Tailwind CSS v4 terbaru (`tailwindcss`) dan plugin resminya untuk bundler Vite (`@tailwindcss/vite`) yang kompatibel dengan React 19 dan Vite 7.
  * Menghapus dependensi paket `openai` dari frontend karena sudah sepenuhnya digantikan oleh Supabase Edge Functions yang di-deploy di Sprint 1.
  * Mendaftarkan plugin `@tailwindcss/vite` di file [vite.config.ts](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/vite.config.ts).
  * Menambahkan directive `@import "tailwindcss";` di baris teratas [index.css](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/src/index.css).

### Task 2.3 — Audit dan Selaraskan Design Tokens
* **Tindakan:**
  * Mendaftarkan seluruh CSS Custom Properties `:root` (seperti `--primary`, `--primary-dark`, dll.) ke dalam sistem tema Tailwind menggunakan blok directive `@theme` baru di [index.css](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/src/index.css).
  * Ini memungkinkan kelas utility Tailwind seperti `bg-primary`, `text-text-light`, dan `border-border` secara dinamis merujuk ke variable CSS Vanilla yang sama, menjaga konsistensi visual di seluruh aplikasi.
  * Merapikan urutan `@import` di index.css agar font Google dideklarasikan sebelum pemrosesan directive Tailwind untuk menghindari peringatan parser.
  * Menghapus selector pseudo-class non-standar `:contains` (seperti `blockquote:contains("[KRITIS]")`) yang memicu peringatan build optimasi CSS dan tidak didukung browser modern asli. Selector digantikan dengan class selector standar (`.kritis`, `.peringatan`, `.info`, `.saran`).

---

## 🧪 Hasil Pengujian & Verifikasi

1. **Local Build Check:** 
   Perintah `npm run build` sukses 100% dan menghasilkan bundle aset yang bersih tanpa ada satupun *warning* CSS.
2. **Kompatibilitas Framework:**
   Tailwind CSS v4 berhasil terintegrasi secara mulus dengan Vite 7 dan React 19.
3. **Uji Coba Aset:**
   Seluruh utilitas CSS lama tetap berfungsi tanpa terjadi tabrakan/konflik visual (*layout regression*).
