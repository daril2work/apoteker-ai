# RAG Data Ingestion Scripts

Folder ini berisi skrip untuk memasukkan dokumen referensi ke dalam Supabase Vector Database.

## Persiapan Menjalankan `ingest_data.ts`

Skrip ini memerlukan koneksi ke **Supabase** dan API Key **OpenAI (Sumopod)**.

1. **Install dependencies tambahan (opsional jika hanya menjalankan skrip lokal):**
   ```bash
   npm install dotenv openai @supabase/supabase-js
   npm install -D tsx
   ```

2. **Siapkan Environment Variables:**
   Buat file `.env` di *root folder* proyek Anda (jika belum ada) dan isi dengan:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://[PROJECT-ID].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY] # WAJIB service role agar bisa bypass RLS saat insert
   
   # OpenAI / Sumopod Configuration
   OPENAI_API_KEY=sk-sumopod-key-anda
   OPENAI_BASE_URL=https://api.sumopod.com/v1 # Sesuaikan dengan URL endpoint Sumopod
   ```

3. **Siapkan Data Referensi:**
   - Buat folder `data_source` di *root* proyek.
   - Masukkan dokumen referensi Anda dalam format `.txt` ke folder tersebut.

4. **Jalankan Skrip:**
   ```bash
   npx tsx scripts/ingest_data.ts
   ```

## Catatan
Jika dokumen Anda masih dalam bentuk PDF, Anda perlu mengekstraknya menjadi teks biasa (`.txt`) terlebih dahulu, atau memodifikasi skrip `ingest_data.ts` dengan menggunakan library tambahan seperti `pdf-parse` untuk mengekstrak teks PDF secara langsung di dalam NodeJS.
