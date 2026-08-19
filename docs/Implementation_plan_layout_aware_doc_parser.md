# Peningkatan Kualitas RAG dengan Layout-Aware Document Parser

Rencana ini menjelaskan bagaimana kita akan mengubah arsitektur penyerapan (ingestion) dokumen RAG di aplikasi Farmasiku agar cerdas dalam membaca tata letak (layout) PDF medis yang kompleks, seperti format multi-kolom, tabel algoritme, dan bagan alur.

> [!WARNING]
> Perubahan ini memerlukan pengalihan beban kerja ekstraksi PDF dari *frontend* (Browser) ke *backend* (API pihak ketiga). Ekstraksi di browser dengan `pdf.js` tidak mampu memahami struktur spasial dan tabel.

## User Review Required
Pendekatan terbaik untuk parsing dokumen kompleks tanpa harus membangun infrastruktur AI *Computer Vision* sendiri adalah dengan menggunakan layanan pihak ketiga yang spesialis dalam mengekstrak Markdown dari PDF. Layanan yang paling populer dan akurat saat ini adalah **LlamaParse** (dari LlamaIndex) atau **Unstructured API**. 

Keduanya memiliki skema gratis (Free Tier), namun Anda perlu menyetujui penggunaan layanan eksternal ini karena dokumen PDF akan dikirimkan ke server mereka untuk di-parsing menjadi Markdown. 

## Open Questions
> [!IMPORTANT]
> 1. **Pilihan Layanan Parsing:** Apakah Anda setuju kita menggunakan **LlamaParse**? LlamaParse sangat handal mengubah tabel dan kolom PDF menjadi format Markdown yang rapi. Anda hanya perlu membuat akun gratis di LlamaCloud untuk mendapatkan API Key-nya.
> 2. **Metode Chunking:** Dengan menggunakan format Markdown, saya berencana mengubah logika pemotongan dokumen (*chunking*) dari yang sebelumnya hanya dipotong per 500 token, menjadi **Markdown-Aware Chunking** (memotong berdasarkan judul Bab `#`, `##`, atau spasi ganda) agar satu konteks algoritme tidak terputus. Apakah Anda setuju?

## Proposed Changes

### Frontend (Dashboard Admin)
Mengubah cara kerja `AdminRAGPage.tsx`. Sebelumnya PDF dibaca di browser menggunakan `pdfjs-dist` lalu teksnya dikirim. Nanti, halaman ini akan langsung mengirimkan *file fisik PDF* tersebut ke *Edge Function* di Supabase.

#### [MODIFY] src/pages/admin/AdminRAGPage.tsx
- Menghapus dependensi `pdfjs-dist` yang berat.
- Mengubah fungsi `handlePdfUpload` untuk menggunakan `FormData` dan langsung memanggil endpoint `process-rag-document`.
- Menambahkan *loading state* karena proses parsing di server (OCR) akan memakan waktu lebih lama.

### Backend (Supabase Edge Functions)
Edge function akan dimodifikasi untuk menerima *file* dan berinteraksi dengan API parser eksternal.

#### [MODIFY] supabase/functions/process-rag-document/index.ts
- Mendukung penerimaan tipe konten `multipart/form-data`.
- Meneruskan *file* PDF yang diterima ke API LlamaParse.
- Menerima kembali hasil ekstraksi teks berupa format Markdown yang rapi.
- Mengubah fungsi `chunkText()` menjadi fungsi pemecah struktur Markdown (`Markdown-Aware Chunking`) agar tabel dan paragraf dalam satu bab tidak terbelah.
- Sisanya tetap sama: membuat *embedding* dengan Sumopod/OpenAI dan menyimpannya ke `knowledge_documents`.

## Verification Plan

### Manual Verification
1. **Pengujian Upload:** Meminta Anda (Admin) untuk kembali mengunggah dokumen PDF *2025 AHA/ACC Guideline* melalui UI Admin.
2. **Pengecekan Teks:** Memverifikasi hasil ekstraksi teks yang masuk ke tabel `knowledge_documents` di Supabase untuk memastikan format tabel dan paragraf multi-kolom tidak rusak dan terbaca sejajar secara logis.
3. **Pengujian Chatbot:** Menanyakan kembali kueri *"bagaimana algoritme terapi hipertensi tanpa penyulit"* pada *Widget Chat* untuk memastikan AI dapat memberikan jawaban akurat dari bagan/tabel panduan.
