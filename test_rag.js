import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRAG() {
  console.log("Checking knowledge documents in database...");
  const { data, error } = await supabase.from('knowledge_documents').select('id, metadata').limit(10);
  
  if (error) {
    console.error("Error fetching docs:", error);
    return;
  }
  
  console.log("Documents in DB:", data);
  if (!data || data.length === 0) {
    console.log("THE DATABASE IS EMPTY! You need to upload the PDF via AdminRAGPage first.");
  }
}

testRAG();

testRAG();
