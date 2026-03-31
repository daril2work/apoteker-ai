-- FarmasiKu Supabase Initialization Script
-- Jalankan skrip ini pada menu SQL Editor di Supabase Dashboard.

-- 1. Create usage_logs table
CREATE TABLE usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create documents table (for storing Consultation & Screening history later)
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'consultation' or 'screening'
    input_data JSONB,
    output_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscriptions table
CREATE TABLE subscriptions (
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
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for usage_logs
CREATE POLICY "Users can only see their own usage_logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage_logs" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for documents
CREATE POLICY "Users can only see their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for subscriptions
CREATE POLICY "Users can only see their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Optional: Create trigger to automatically assign tier to new users in metadata
-- (Since metadata is passed from signup, this is optional for tracking schema)
