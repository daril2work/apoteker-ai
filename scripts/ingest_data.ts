import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Konstanta konfigurasi OpenAI via Sumopod
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sumopod_key_here';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.sumopod.com/v1'; // Sesuaikan URL Sumopod

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Inisialisasi OpenAI via Sumopod
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

/**
 * Memecah teks menjadi chunk dengan ukuran tertentu agar tidak melebihi token limit.
 * Fungsi ini menggunakan pendekatan pemotongan sederhana berdasarkan jumlah karakter atau kata.
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  // Menghapus baris kosong berlebih
  const cleanText = text.replace(/\n\s*\n/g, '\n\n').trim();
  
  // Memecah berdasarkan paragraf
  const paragraphs = cleanText.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Menghasilkan vektor embedding menggunakan model text-embedding OpenAI
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // Atau text-embedding-ada-002
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Membaca dan memproses semua file .txt di folder tertentu
 * Catatan: Untuk PDF, Anda mungkin perlu menambahkan library seperti 'pdf-parse'
 * untuk mengekstrak teksnya terlebih dahulu.
 */
async function ingestDocuments(folderPath: string) {
  try {
    const files = fs.readdirSync(folderPath);
    console.log(`Menemukan ${files.length} file di ${folderPath}`);

    for (const file of files) {
      if (!file.endsWith('.txt')) {
        console.log(`Mengabaikan file non-text: ${file}`);
        continue;
      }

      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`Memproses file: ${file}`);
      
      // 1. Pecah teks menjadi chunk
      const chunks = chunkText(content, 1500); // ~300-400 tokens per chunk
      console.log(`  File dipecah menjadi ${chunks.length} chunks.`);

      // 2. Untuk setiap chunk, buat embedding dan simpan ke Supabase
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Generate embedding
          const embedding = await getEmbedding(chunk);

          // Simpan ke Supabase
          const { error } = await supabase
            .from('knowledge_documents')
            .insert({
              content: chunk,
              metadata: {
                source: file,
                chunk_index: i,
                total_chunks: chunks.length
              },
              embedding: embedding,
            });

          if (error) {
            console.error(`  Error menyimpan chunk ${i} dari ${file}:`, error.message);
          } else {
            console.log(`  ✓ Tersimpan chunk ${i + 1}/${chunks.length} dari ${file}`);
          }
          
          // Beri jeda sedikit agar tidak kena rate limit (opsional, tergantung provider)
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err: any) {
          console.error(`  Gagal memproses chunk ${i} dari ${file}:`, err.message);
        }
      }
    }
    
    console.log('Ingestion selesai!');
  } catch (error) {
    console.error('Error saat membaca folder:', error);
  }
}

// Eksekusi script
// Pastikan membuat folder 'data_source' dan meletakkan file TXT referensi di dalamnya
const SOURCE_DIR = path.join(__dirname, '../data_source');
if (!fs.existsSync(SOURCE_DIR)) {
  fs.mkdirSync(SOURCE_DIR);
  console.log(`Folder ${SOURCE_DIR} telah dibuat. Silakan letakkan file teks referensi di sana.`);
} else {
  ingestDocuments(SOURCE_DIR);
}
