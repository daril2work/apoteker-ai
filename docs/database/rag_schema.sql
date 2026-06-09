-- FarmasiKu RAG (Retrieval-Augmented Generation) Schema
-- Jalankan skrip ini pada menu SQL Editor di Supabase Dashboard untuk Sprint 1

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,          -- Teks asli dari buku/dokumen hasil chunking
    metadata JSONB,                 -- Informasi sumber, judul buku, halaman, dll
    embedding VECTOR(1536),         -- Vector embedding (1536 dimensi untuk model OpenAI text-embedding-ada-002 / text-embedding-3-small)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster vector similarity search
-- Menggunakan indeks HNSW (Hierarchical Navigable Small World) untuk pencarian cosine similarity yang lebih cepat
CREATE INDEX ON knowledge_documents USING hnsw (embedding vector_cosine_ops);

-- 4. Enable RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Secara default, frontend tidak boleh membaca tabel ini secara langsung
-- Tabel ini hanya akan diakses lewat Supabase Edge Functions (menggunakan service role key)
CREATE POLICY "Deny all access from anonymous and authenticated users" 
ON knowledge_documents 
FOR ALL USING (false);

-- 6. Create Edge Function Helper (Vector Search Function)
-- Fungsi ini akan dipanggil oleh Edge Function nanti lewat supabase_client.rpc()
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (knowledge_documents.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents
  WHERE 1 - (knowledge_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
