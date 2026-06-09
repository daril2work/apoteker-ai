# Implementasi RAG (Retrieval-Augmented Generation) di Farmasiku

Rencana implementasi RAG ke dalam aplikasi Farmasiku untuk meningkatkan akurasi asisten klinis pada MTM (Medication Therapy Management). Implementasi ini dibagi menjadi 4 sprint.

## User Review Required
> [!IMPORTANT]  
> Mohon konfirmasi apakah pembagian 4 sprint ini sudah sesuai dengan prioritas dan kapasitas tim Anda. Perlu diputuskan juga model Embedding dan LLM apa yang akan digunakan (misal: OpenAI API atau Google Gemini API).

## Open Questions
> [!NOTE]  
> - **[TERJAWAB]** Tim sudah memiliki dokumen referensi (Pedoman Farmasi, MIMS, dll) dalam bentuk PDF/Teks yang siap di-ingest ke sistem.
> - **[TERJAWAB]** Menggunakan OpenAI (via **sumopod**) untuk Edge Functions LLM dan Embeddings.

## Proposed Changes

### Sprint 1: Setup Vector Database & Data Ingestion (Backend)
Fokus: Mempersiapkan Supabase untuk menyimpan dokumen bervektor dan membuat script untuk memasukkan data pengetahuan awal.
- Mengaktifkan ekstensi `pgvector` di Supabase.
- Membuat tabel `knowledge_documents` beserta index HNSW/IVFFlat untuk optimasi pencarian.
- Membuat script ingestion (Node.js/Python) untuk membaca PDF, memotong teks (chunking), melakukan embedding, dan menyimpannya ke Supabase.
#### [NEW] docs/database/rag_schema.sql
#### [NEW] scripts/ingest_data.ts

### Sprint 2: RAG Backend & LLM Integration (Edge Functions)
Fokus: Membuat API perantara (Supabase Edge Function) yang aman agar Frontend tidak mengekspos API Key.
- Mengonfigurasi Supabase Edge Function (Deno).
- Menerima kueri pencarian, melakukan embedding pada kueri tersebut, dan melakukan *Vector Search* (cosine similarity) ke tabel `knowledge_documents`.
- Merangkai *Prompt* dengan menggabungkan konteks dokumen + kueri pengguna.
- Memanggil LLM API (OpenAI/Gemini) dan mengembalikan jawaban.
#### [NEW] supabase/functions/rag-assistant/index.ts

### Sprint 3: Integrasi Frontend (UI/UX)
Fokus: Membangun antarmuka AI Assistant di halaman MTM Session.
- Membuat komponen Chat UI di `MTMSessionPage.tsx`.
- Menyambungkan frontend dengan endpoint Edge Function RAG.
- Menangani *loading state* dan *error handling*.
- Melakukan *rendering* jawaban AI menggunakan `react-markdown` (karena LLM biasanya merespons dengan Markdown).
#### [MODIFY] src/pages/dashboard/MTMSessionPage.tsx
#### [NEW] src/components/MTM/AiAssistant.tsx

### Sprint 4: Contextual Awareness & Refinement (Advanced)
Fokus: Menyempurnakan RAG agar AI tahu konteks pasien yang sedang ditangani.
- Memodifikasi Edge Function agar juga menerima `patient_id` atau data pasien (Alergi, Penyakit Kronis).
- Mengintegrasikan data alergi & penyakit kronis pasien ke dalam *system prompt* LLM.
- Menampilkan kutipan sumber (citation) di jawaban UI ("Berdasarkan Pedoman X, halaman Y").
- Testing, evaluasi metrik akurasi RAG, dan *deployment* ke *production*.
#### [MODIFY] supabase/functions/rag-assistant/index.ts
#### [MODIFY] src/components/MTM/AiAssistant.tsx

## Verification Plan

### Automated Tests
- Menulis unit test untuk fungsi *chunking* dokumen.
- Menulis test untuk Supabase Edge Function memastikan koneksi LLM berhasil.

### Manual Verification
- Melakukan kueri pertanyaan klinis spesifik ke UI dan memastikan AI menjawab hanya menggunakan konteks referensi yang diunggah (tidak berhalusinasi).
