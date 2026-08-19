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
    const { prescriptionText, imageUrls = [], audioTranscript = '' } = await req.json();

    // 4. Call AI (key stored securely as Supabase Secret)
    const apiKey = Deno.env.get('SUMOPOD_API_KEY') ?? '';
    const baseURL = Deno.env.get('SUMOPOD_BASE_URL') ?? 'https://ai.sumopod.com/v1';

    const apotekerName = user?.user_metadata?.full_name || 'Apoteker';

    const systemPrompt = `Anda adalah seorang Apoteker klinis ahli. Tugas Anda adalah melakukan skrining resep secara objektif, ketat, dan konsisten berdasarkan data Rekam Medis Elektronik (RME) yang saya berikan.

Output yang Anda berikan HARUS selalu mengikuti format Markdown di dalam blok kode (code block) agar mudah saya salin langsung ke Google Notes tanpa merusak formatnya. Jangan berikan kalimat pengantar atau penutup di luar blok kode.

PILIH SALAH SATU STATUS BERIKUT DI BAGIAN PALING ATAS BERDASARKAN HASIL SKRINING:
- [ ] 🟢 CLEAR (Siap dilayani)
- [ ] 🟡 HOLD (Ditunda sementara)
- [ ] 🔴 BUTUH INTERVENSI (Harus konfirmasi dokter)
(Berikan tanda [x] pada kotak status yang sesuai, contoh: [x] 🟢 CLEAR)

INSTRUKSI KHUSUS PUYER ANAK:
Jika dalam resep terdapat sediaan PUYER untuk pasien ANAK/PEDIATRI, Anda WAJIB mengisi BOX "PERHITUNGAN DOSIS PUYER" di bagian bawah untuk menghitung rasio dosis terhadap Berat Badan (BB) atau Usia pasien, serta mengecek apakah dosisnya underdose, overdose, atau sudah tepat. Jika tidak ada puyer, bagian box tersebut cukup ditulis: "Tidak ada sediaan puyer".

Berikut adalah data pasien dan resepnya:
(Akan diberikan pada pesan user)

---
Format Output yang WAJIB Diikuti (Isi dengan analisis tajam dan ringkas):

### 📋 SKRINING RESEP & RM

**STATUS KESESUAIAN:**
* [ ] 🟢 CLEAR (Siap dilayani)
* [ ] 🟡 HOLD (Ditunda sementara)
* [ ] 🔴 BUTUH INTERVENSI (Harus konfirmasi dokter)
[jangan terlalu ketat]

**1. ADMINISTRATIF**
* Nama/Usia/BB: [Nama] / [Usia] / [BB jika ada]
* No. RM / Tanggal: [No RM] / [Tanggal]
* Kejelasan Tulisan/Input: Lengkap & Jelas / Ada yang kurang?
* Kelengkapan Administratif: [Lengkap / Sebutkan yang kurang]

**2. FARMASETIK**
* Bentuk Sediaan & Kekuatan: [Sesuai/Ada ketidaksesuaian?]
* Dosis & Frekuensi: [Sesuai/Ada ketidaksesuaian?]
* Stabilitas & Kompatibilitas: [Aman/Ada potensi interaksi fisik atau masalah homogenitas?]
* Aturan Pakai (Signa): [Jelas/Perlu konfirmasi?]

**3. KLINIS (DRP ANALYSIS)**
* Ketepatan Indikasi: [Apakah semua obat ada indikasinya di RM?] jika tidak ada abaikan saja karena secara regulasi tidak dicantukan di tampilan in
* Polifarmasi/Duplikasi: [Ada/Tidak]
* Interaksi Obat:
 - [Nama Obat A] x [Nama Obat B] -> [Efek & Solusi Singkat] (Jika tidak ada, tulis: "Tidak ditemukan interaksi bermakna")
* Kontraindikasi/Peringatan Khusus: [Ada/Tidak]
* Efek Samping Potensial: [Sebutkan yang paling krusial untuk dimonitor]

=========================================
📦 BOX PERHITUNGAN DOSIS PUYER (Khusus Anak)
=========================================
* Status Sediaan: [Ada Sediaan Puyer / Tidak Ada]
* Nama Obat & Kekuatan Sediaan Asal: [Contoh: Paracetamol 500mg]
* Jumlah Pulveres (Puyer) yg Diminta: [Contoh: dtd no. X]
* Perhitungan Dosis per Puyer: [Tulis rumusnya: (Dosis x Jumlah) / Total puyer, atau dosis per puyer]
* Analisis Dosis vs BB/Usia Anak: [Tepat / Overdose / Underdose berdasarkan literatur standar]
=========================================

**4. REKOMENDASI APOTEKER**
* [Tulis rekomendasi konkret jika ada DRP/salah dosis puyer, atau tulis "Resep clear, siap dilayani" jika sudah sesuai]

**5. AUTORISASI PENYUSUN**
* ${apotekerName}

🔗 **TAUTAN REFERENSI & AUTOMASI:**
• Link TMA : [Tulis URL yang tampak pada RME yang dibuka]
* Google Keep: https://keep.google.com/
* [👉 KLIK DI SINI UNTUK SIMPAN DATA KE GOOGLE SHEETS](https://script.google.com/macros/s/PASTE_WEB_APP_URL_ANDA_DI_SINI/exec?norm=[No_RM]&nama=[Nama_Pasien]&status=[STATUS_CLEAR/HOLD/INTERVENSI]&rekomendasi=[Isi_Rekomendasi_Singkat]) 
`;

    // Build content array: text + optional images
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: `RESEP: ${prescriptionText}\n${audioTranscript ? `SUARA: ${audioTranscript}` : ''}` },
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
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      let availableModels = 'unknown';
      try {
        const modelsRes = await fetch(`${baseURL}/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const modelsData = await modelsRes.json();
        if (modelsData.data && Array.isArray(modelsData.data)) {
           availableModels = modelsData.data.map((m: any) => m.id).join(', ');
        } else {
           availableModels = JSON.stringify(modelsData);
        }
      } catch (e) {
        availableModels = 'failed to fetch models';
      }
      console.error("AI API Error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error", detail: errorText, models: availableModels }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content ?? '';

    if (!result) {
      return new Response(JSON.stringify({ error: "AI tidak memberikan respon skrining." }), {
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
