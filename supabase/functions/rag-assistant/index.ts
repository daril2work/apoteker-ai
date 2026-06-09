import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No Authorization header" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Parse Request
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get('SUMOPOD_API_KEY') ?? '';
    const baseURL = Deno.env.get('SUMOPOD_BASE_URL') ?? 'https://api.sumopod.com/v1';

    // 4. Generate Embedding for the query
    const embeddingResponse = await fetch(`${baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // Default model untuk text embedding
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Embedding API Error:", errorText);
      return new Response(JSON.stringify({ error: "Gagal membuat embedding", detail: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;

    if (!queryEmbedding) {
       return new Response(JSON.stringify({ error: "Embedding tidak ditemukan di respon API." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    // 5. Vector Search via RPC match_documents
    const { data: documents, error: matchError } = await supabaseClient.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.70, // Sesuaikan threshold similarity
      match_count: 5,        // Ambil top 5 dokumen paling relevan
    });

    if (matchError) {
      console.error("Vector Match Error:", matchError);
      return new Response(JSON.stringify({ error: "Gagal mencari dokumen di database." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Susun referensi context dari hasil match
    let contextText = "";
    if (documents && documents.length > 0) {
      contextText = documents.map((doc: any, i: number) => {
        const source = doc.metadata?.source ? `(Sumber: ${doc.metadata.source})` : '';
        return `[Dokumen ${i + 1}] ${source}:\n${doc.content}`;
      }).join("\n\n");
    } else {
      contextText = "Tidak ada dokumen referensi yang relevan ditemukan di database.";
    }

    // 6. Augment Prompt & Call LLM for Completion
    const systemPrompt = `Anda adalah Asisten Klinis Farmasiku yang cerdas untuk layanan Medication Therapy Management (MTM).
Tugas Anda adalah menjawab pertanyaan apoteker BERDASARKAN DOKUMEN REFERENSI berikut. 
Jika dokumen referensi tidak memiliki informasi yang cukup untuk menjawab pertanyaan, nyatakan dengan jujur bahwa Anda tidak menemukan informasinya di pedoman, sebelum Anda memberikan jawaban umum berdasarkan pengetahuan medis Anda.

REFERENSI DOKUMEN:
${contextText}

ATURAN MENJAWAB:
- Jawab dengan bahasa Indonesia yang profesional dan mudah dipahami.
- Selalu cantumkan kutipan dokumen referensi jika Anda menggunakannya (contoh: "Berdasarkan Dokumen 1, ...").
- Format dengan Markdown untuk memudahkan keterbacaan (gunakan bullet point, bold, dst).`;

    const chatResponse = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        stream: true, // User requested streaming
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("LLM API Error:", errorText);
      return new Response(JSON.stringify({ error: "LLM service error", detail: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    // 7. Proxy the Stream back to the client
    return new Response(chatResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
