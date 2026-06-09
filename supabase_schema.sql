-- FarmasiKu Supabase Initialization Script
-- Jalankan skrip ini pada menu SQL Editor di Supabase Dashboard.

-- 1. Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create documents table (for storing Consultation & Screening history later)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'consultation' or 'screening'
    input_data JSONB,
    output_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2a. Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    no_rm VARCHAR(50),
    dob DATE,
    gender VARCHAR(20),
    allergies TEXT,
    chronic_diseases TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2b. Create mtm_sessions table
CREATE TABLE IF NOT EXISTS mtm_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clinical_data JSONB,
    medications_data JSONB,
    mtr_result JSONB,
    cppt_result JSONB,
    map_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    midtrans_id TEXT,
    status TEXT,
    expired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for usage_logs
CREATE POLICY "Users can only see their own usage_logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage_logs" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CATATAN KEAMANAN: Tidak ada policy DELETE pada usage_logs. 
-- Ini disengaja untuk mempertahankan jejak audit (audit trail) dokumen pengguna.
-- Jika di masa mendatang diperlukan, tambahkan policy DELETE hanya untuk admin role.

-- 6. RLS Policies for documents
CREATE POLICY "Users can only see their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- 6a. RLS Policies for patients
CREATE POLICY "Users can only see their own patients" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patients" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patients" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patients" ON patients FOR DELETE USING (auth.uid() = user_id);

-- 6b. RLS Policies for mtm_sessions
CREATE POLICY "Users can only see their own mtm_sessions" ON mtm_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mtm_sessions" ON mtm_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mtm_sessions" ON mtm_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mtm_sessions" ON mtm_sessions FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for subscriptions
CREATE POLICY "Users can only see their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Optional: Create trigger to automatically assign tier to new users in metadata
-- (Since metadata is passed from signup, this is optional for tracking schema)

-- ==============================================================================
-- RAG (Retrieval-Augmented Generation) SCHEMA
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster vector similarity search
CREATE INDEX ON knowledge_documents USING hnsw (embedding vector_cosine_ops);

-- 4. Enable RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Secara default, frontend tidak boleh membaca tabel ini secara langsung
-- Tabel ini hanya akan diakses lewat Supabase Edge Functions
CREATE POLICY "Deny all access from anonymous and authenticated users" 
ON knowledge_documents 
FOR ALL USING (false);

-- 6. Create Edge Function Helper (Vector Search Function)
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
