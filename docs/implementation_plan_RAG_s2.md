# Implementation Plan RAG - Sprint 2: Backend & LLM Integration

Fokus: Membuat API perantara (Supabase Edge Function) yang aman untuk memproses query manual dari user/apoteker, sehingga API Key terlindungi di sisi server.

## Tugas yang Diselesaikan
1. **Membuat Edge Function `rag-assistant`** (`supabase/functions/rag-assistant/index.ts`).
2. **Setup CORS & Auth:** Memastikan fungsi ini hanya dapat diakses oleh user yang sudah login di aplikasi Farmasiku (validasi token JWT).
3. **Integrasi Sumopod Embeddings:** Mengonversi input teks menjadi vektor (menggunakan model `text-embedding-3-small`).
4. **Vector Search:** Memanggil RPC `match_documents` di Supabase untuk mencari pedoman yang relevan berdasarkan kemiripan *cosine*.
5. **Streaming Chat Completions:** Mengirim hasil pedoman beserta instruksi ke model `gpt-4o-mini` via API Sumopod dengan pengaturan `stream: true`, dan mem-proxy *Server-Sent Events (SSE)* tersebut kembali ke *frontend*.

## Files Modifikasi & Baru
- `[NEW]` [supabase/functions/rag-assistant/index.ts](file:///c:/Users/USER/.gemini/antigravity/scratch/farmasiku/supabase/functions/rag-assistant/index.ts)

## Status
✅ **SELESAI DIEKSEKUSI & DEPLOYED**
