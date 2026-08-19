import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth check
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

    // 2. Usage limit check (backend enforcement)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabaseClient
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('status, expired_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expired_at', new Date().toISOString())
      .single();

    const userTier = subscription ? 'pro' : 'free';
    if (userTier === 'free' && (count ?? 0) >= 15) {
      return new Response(JSON.stringify({ error: "LIMIT_REACHED", message: "Batas 15 dokumen/bulan untuk Free tier telah tercapai." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // 3. Parse request body
    const { patientData, clinicalData, medicationsData, historyContext, imageUrls = [] } = await req.json();

    // 4. Extract Query for RAG
    const ragQuery = `${patientData?.diagnosis || ''} ${clinicalData?.subjective || ''} ${medicationsData?.currentMedications || ''}`.trim();
    
    const apiKey = Deno.env.get('SUMOPOD_API_KEY') ?? '';
    const baseURL = Deno.env.get('SUMOPOD_BASE_URL') ?? 'https://ai.sumopod.com/v1';

    let contextText = "Tidak ada dokumen referensi yang ditarik dari database.";
    
    // 5. Generate Embedding & Vector Search
    if (ragQuery.length > 5) {
      try {
        const embeddingResponse = await fetch(`${baseURL}/embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: ragQuery,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.data?.[0]?.embedding;
          
          if (queryEmbedding) {
            const { data: documents } = await supabaseClient.rpc('match_documents', {
              query_embedding: queryEmbedding,
              match_threshold: 0.65, // Threshold diturunkan sedikit untuk jaring lebih luas
              match_count: 5,
            });
            
            if (documents && documents.length > 0) {
              contextText = documents.map((doc: any, i: number) => {
                const source = doc.metadata?.source ? `(Sumber: ${doc.metadata.source})` : '';
                return `[Dokumen ${i + 1}] ${source}:\n${doc.content}`;
              }).join("\n\n");
            }
          }
        } else {
          console.error("Embedding failed:", await embeddingResponse.text());
        }
      } catch (err) {
        console.error("Vector search exception:", err);
      }
    }

    // 6. Call AI (key stored securely as Supabase Secret)
    const patientAllergies = patientData?.allergies || 'Tidak ada catatan alergi';
    const patientChronicDiseases = patientData?.chronic_diseases || 'Tidak ada catatan penyakit kronis';

    const systemPrompt = `Anda adalah Apoteker Klinis Ahli. Tugas Anda adalah melakukan Medication Therapy Management (MTM) berdasarkan data pasien secara komprehensif dan akurat berbasis Evidence-Based Medicine (EBM).
Anda HARUS mengembalikan respon dalam format JSON yang valid.
Struktur JSON wajib memiliki 3 key berikut:
{
  "mtr_result": "String format markdown berisi hasil Medication Therapy Review (MTR). Berikan analisis DRP (Drug-Related Problems), potensi interaksi obat, kesesuaian dosis, dan efektivitas terapi dengan DESKRIPSI PENJELASAN YANG MENDALAM. Jangan terlalu singkat.",
  "cppt_result": "String format markdown berisi catatan SOAP formal untuk rekam medis puskesmas. Pada bagian 'A' (Assessment) sertakan ringkasan analisis DRP beserta penjelasan klinisnya, dan pada 'P' (Plan) sertakan Monitoring Plan & Rekomendasi/Kolaborasi.",
  "map_result": "String format markdown berisi Medication-Related Action Plan. Ini adalah instruksi minum obat dan saran non-farmakologi dengan bahasa AWAM untuk pasien bawa pulang beserta alasan kenapa instruksi tersebut penting."
}

STANDAR EBM WAJIB:
- Layer 1 (Nasional): PMK 74/2016, KMK PPK FKTP, Fornas.
- Layer 2 (Spesifik): GINA, GOLD, ADA/PERKENI, AHA/ACC/ESC, IDSA, KDIGO.
- Layer 3 (Farmakoterapi): DiPiro (Pharmacotherapy: A Pathophysiologic Approach), Koda-Kimble (Applied Therapeutics), Stockley (Interaksi).
- Layer 4 (Evidence Terbaru): High-Impact Journals (NEJM, Lancet, BMJ, JAMA, Cochrane).

PASTIKAN HASILNYA ADALAH JSON VALID TANPA MARKDOWN BACKTICKS DI LUAR JSON.

REFERENSI KLINIS TERKAIT (DARI DATABASE EBM/RAG LOKAL):
${contextText}

🚨 CRITICAL SAFETY WARNING 🚨
PASIEN MEMILIKI KONDISI BERIKUT:
- ALERGI: ${patientAllergies}
- PENYAKIT KRONIS (PENYERTA): ${patientChronicDiseases}

ANDA WAJIB MELAKUKAN CROSS-CHECK OBAT YANG DIRESEPKAN TERHADAP ALERGI DAN PENYAKIT KRONIS DI ATAS!
Jika ditemukan potensi interaksi obat-penyakit (Drug-Disease Interaction) atau obat-alergi, BERIKAN PERINGATAN KERAS di dalam MTR dan CPPT.

ATURAN TAMBAHAN BERKAITAN REFERENSI (SITASI): 
1. Jika Referensi Klinis Terkait (RAG Lokal) tidak memberikan informasi yang cukup, gunakan pengetahuan EBM (Layer 1-4) yang Anda miliki untuk memberikan analisis dan penjelasan yang lengkap.
2. JIKA Anda menggunakan informasi dari Referensi Klinis (RAG Lokal), WAJIB cantumkan sitasi secara eksplisit dengan format cetak miring di akhir kalimat. Contoh: *(Sumber: Pedoman Hipertensi Hal 45)*.
3. Selalu sebutkan sumber panduan/guideline yang mendasari analisis Anda di dalam penjelasan MTR dan CPPT.`;

    const userTextContent = `DATA PASIEN: ${JSON.stringify(patientData)}
KLINIS SAAT INI (S & O): ${JSON.stringify(clinicalData)}
REKONSILIASI OBAT: ${JSON.stringify(medicationsData)}
RIWAYAT SESI SEBELUMNYA: ${historyContext || 'Tidak ada'}`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: userTextContent },
    ];

    if (imageUrls && imageUrls.length > 0) {
      imageUrls.forEach((url: string) => {
        userContent.push({ type: 'image_url', image_url: { url } });
      });
    }

    const aiResponse = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini/gemini-2.5-pro',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 8000,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API Error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error", detail: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content ?? '';

    if (!result) {
      return new Response(JSON.stringify({ error: "AI tidak memberikan respon." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const tokens_used = aiData.usage?.total_tokens || 0;

    return new Response(JSON.stringify({ result, tokens_used }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
