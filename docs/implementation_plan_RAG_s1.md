# Implementation Plan RAG - Sprint 1: Setup Vector Database & Data Ingestion

Fokus: Mempersiapkan Supabase untuk menyimpan dokumen bervektor dan membuat script untuk memasukkan data pengetahuan awal.

## Tugas yang Diselesaikan
1. **Mengaktifkan ekstensi `pgvector` di Supabase.**
2. **Membuat tabel `knowledge_documents` beserta index HNSW/IVFFlat untuk optimasi pencarian.**
3. **Membuat script ingestion (`scripts/ingest_data.ts`) untuk memotong teks (chunking), melakukan embedding via Sumopod (OpenAI), dan menyimpannya ke Supabase.**
4. **Membuat instruksi (`scripts/README.md`) terkait cara mengatur API Keys dan file teks `.txt` untuk proses ingest.**

## Files Modifikasi & Baru
- `[NEW]` [docs/database/rag_schema.sql](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/docs/database/rag_schema.sql)
- `[NEW]` [scripts/ingest_data.ts](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/scripts/ingest_data.ts)
- `[NEW]` [scripts/README.md](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/scripts/README.md)
- `[MODIFY]` [supabase_schema.sql](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/supabase_schema.sql) (Penambahan skema RAG di bagian paling bawah)

## Status
✅ **SELESAI DIEKSEKUSI**
