import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Simple chunking function
function chunkText(text: string, maxTokens = 500) {
  // Rough estimate: 4 chars per token
  const maxChars = maxTokens * 4;
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let nextIndex = currentIndex + maxChars;
    
    if (nextIndex < text.length) {
      // Try to find a sentence break or paragraph break to split
      const lastNewline = text.lastIndexOf('\n', nextIndex);
      const lastPeriod = text.lastIndexOf('.', nextIndex);
      
      if (lastNewline > currentIndex + (maxChars / 2)) {
        nextIndex = lastNewline;
      } else if (lastPeriod > currentIndex + (maxChars / 2)) {
        nextIndex = lastPeriod + 1;
      }
    } else {
      nextIndex = text.length;
    }

    chunks.push(text.substring(currentIndex, nextIndex).trim());
    currentIndex = nextIndex;
  }
  
  return chunks.filter(c => c.length > 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Check admin role
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden. Admin only." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Create admin client for bypassing RLS on knowledge_documents
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { text, metadata } = await req.json();
    if (!text) throw new Error("Text is required");

    const chunks = chunkText(text);
    
    const apiKey = Deno.env.get('SUMOPOD_API_KEY') ?? Deno.env.get('OPENAI_API_KEY') ?? '';
    const baseURL = Deno.env.get('SUMOPOD_BASE_URL') ?? 'https://api.sumopod.com/v1';

    let totalTokensUsed = 0;
    const documentsToInsert = [];

    // OpenAI and Sumopod support batching input strings
    // We send all chunks in one request (up to limits, here we assume chunks array isn't massively huge, 
    // but we can slice it if it's too large. Let's do batches of 50).
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      const embeddingResponse = await fetch(`${baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: batchChunks, // Send array of strings
        }),
      });

      if (!embeddingResponse.ok) {
        const errText = await embeddingResponse.text();
        throw new Error(`Gagal membuat embedding: ${errText}`);
      }

      const embeddingData = await embeddingResponse.json();
      totalTokensUsed += embeddingData.usage?.total_tokens || 0;

      if (!embeddingData.data || embeddingData.data.length === 0) {
        throw new Error(`Respons embedding kosong dari API. Pastikan model tersedia di Sumopod.`);
      }

      // Map each returned embedding to its corresponding chunk
      for (let j = 0; j < batchChunks.length; j++) {
        const emb = embeddingData.data[j]?.embedding;
        if (emb) {
          documentsToInsert.push({
            content: batchChunks[j],
            metadata: metadata || {},
            embedding: emb
          });
        }
      }
    }

    if (documentsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('knowledge_documents')
        .insert(documentsToInsert);
        
      if (insertError) throw new Error(`Database Insert Error: ${insertError.message || JSON.stringify(insertError)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      chunks_processed: chunks.length,
      tokens_used: totalTokensUsed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
