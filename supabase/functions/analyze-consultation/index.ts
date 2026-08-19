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
    const { prescriptionData, patientInfo, subjective, objective, diagnosis } = await req.json();

    // 4. Call AI (key stored securely as Supabase Secret, never exposed to frontend)
    const apiKey = Deno.env.get('SUMOPOD_API_KEY') ?? '';
    const baseURL = Deno.env.get('SUMOPOD_BASE_URL') ?? 'https://ai.sumopod.com/v1';

    const systemPrompt = `Farmasiku: Laporan Pharmacist Care Plan terpadu Berbasis EBM.
STRUKTUR WAJIB (Anda harus mengeluarkan PERSIS 4 bagian ini menggunakan header):
### 1. Identitas Pasien
### 2. Tabel Skrining 4T 1W (Singkat)
### 3. CPPT Terintegrasi
   (Tulis format S-O-A-P. Masukkan ringkasan Analisis DRP di bagian 'A' [Assessment]. Masukkan Monitoring Plan & Rekomendasi/Kolaborasi di bagian 'P' [Plan]. Buat sepadat mungkin agar mudah disalin ke rekam medis)
### 4. Referensi & Sumber EBM 

STANDAR EBM WAJIB:
- Layer 1 (Nasional): PMK 74/2016, KMK PPK FKTP, Fornas.
- Layer 2-4: GINA, GOLD, ADA, AHA, DiPiro, Jurnal High-Impact.

PENTING: TULIS DENGAN SANGAT SINGKAT, PADAT, MENGGUNAKAN BULLET POINTS. Hindari penjelasan panjang lebar. BATASI TOTAL RESPON MAKSIMAL 300 KATA agar tidak terjadi server timeout.`;

    const userContent = `DATA: Pasien(${patientInfo}), Diagnosa(${diagnosis}), Keluhan(${subjective}), Vital(${objective}), Resep(${prescriptionData})`;

    const aiResponse = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        stream: false, // Edge Functions handle streaming differently; use non-stream for reliability
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
