# Implementation Plan RAG - Sprint 3 & 4: Injeksi MTM & Contextual Awareness

Fokus: Mengintegrasikan kemampuan RAG (penelusuran pedoman) ke dalam Edge Function utama (`analyze-mtm`) agar hasil pembuatan dokumen CPPT & MTR yang digenerate AI menjadi jauh lebih bermutu, akurat, dan sangat aman bagi pasien.

## Tugas yang Diselesaikan
1. **Modifikasi `analyze-mtm` Edge Function:** Fungsi sekarang mengekstrak informasi krusial (`patientData.allergies` & `patientData.chronic_diseases`).
2. **Auto-Query RAG:** Menggabungkan keluhan subjektif, diagnosa, dan obat saat ini menjadi sebuah *query*, lalu melakukan *Vector Search* untuk mengambil *Top 5* literatur paling relevan (threshold 0.65).
3. **Injeksi RAG ke System Prompt:** Literatur tersebut dimasukkan langsung ke *system prompt* LLM (Gemini 2.5 Pro) agar output berpedoman padanya.
4. **Safety Guard (Anti-Malapraktik):** Menambahkan peringatan 🚨 **CRITICAL SAFETY WARNING** 🚨 di dalam prompt agar LLM selalu melakukan verifikasi silang (cross-check) resep terhadap alergi dan penyakit penyerta.
5. **Kewajiban Sitasi:** Menginstruksikan LLM untuk selalu menuliskan sumber rujukan/sitasi dengan format *cetak miring* jika mereka menggunakan panduan dari literatur.

## Files Modifikasi & Baru
- `[MODIFY]` [supabase/functions/analyze-mtm/index.ts](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/supabase/functions/analyze-mtm/index.ts)

## Status
✅ **SELESAI DIEKSEKUSI & DEPLOYED**
