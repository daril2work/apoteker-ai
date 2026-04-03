import OpenAI from 'openai';

export const defaultApiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
export const defaultBaseURL = import.meta.env.VITE_SUMOPOD_BASE_URL;

const getOpenAIClient = (config?: { apiKey?: string; baseUrl?: string }) => {
  return new OpenAI({
    apiKey: config?.apiKey || defaultApiKey,
    baseURL: config?.baseUrl || defaultBaseURL,
    dangerouslyAllowBrowser: true
  });
};

export const analyzeConsultation = async (
  prescriptionData: string,
  patientInfo: string,
  subjective: string,
  objective: string,
  diagnosis: string,
  config?: { apiKey?: string; baseUrl?: string },
  onChunk?: (chunk: string) => void
) => {
  const openai = getOpenAIClient(config);
  const stream = await openai.chat.completions.create({
    model: 'gemini/gemini-2.5-pro',
    messages: [
      {
        role: 'system',
        content: `Apoteker AI: Laporan Pharmacist Care Plan terpadu (7 Poin) Berbasis EBM.
        STRUKTUR WAJIB (Anda harus mengeluarkan PERSIS 7 bagian ini menggunakan header):
        ### 1. Identitas Pasien
        ### 2. Tabel Skrining 4T 1W (Singkat)
        ### 3. Dokumentasi SOAP & Analisis DRP (Berdasarkan Guideline Klinis)
        ### 4. Monitoring Plan (Parameter & Frekuensi)
        ### 5. Rekomendasi/Kolaborasi (Kalimat Profesional)
        ### 6. CPPT (Catatan Perkembangan Pasien Terintegrasi - 1 Paragraf Siap Salin)
        ### 7. Referensi & Sumber EBM (Wajib & Spesifik).

        STANDAR EBM WAJIB:
        - Layer 1 (Nasional): PMK 74/2016, KMK PPK FKTP 2022, Fornas.
        - Layer 2 (Spesifik): GINA, GOLD, ADA/PERKENI, AHA/ACC/ESC, IDSA, KDIGO.
        - Layer 3 (Farmakoterapi): DiPiro (Pharmacotherapy: A Pathophysiologic Approach), Koda-Kimble (Applied Therapeutics), Stockley (Interaksi).
        - Layer 4 (Evidence Terbaru): High-Impact Journals (NEJM, Lancet, BMJ, JAMA, Cochrane).

        PENTING: Jangan gabungkan bagian CPPT dengan bagian lain. Bagian "### 6. CPPT" harus selalu ada dan berisi rangkuman singkat (S, O, A, P) siap salin untuk rekam medis. Gunakan gaya medis profesional.`
      },
      {
        role: 'user',
        content: `DATA: Pasien(${patientInfo}), Diagnosa(${diagnosis}), Keluhan(${subjective}), Vital(${objective}), Resep(${prescriptionData})`
      }
    ],
    temperature: 0.3,
    max_tokens: 4000,
    stream: true
  });

  let fullResponse = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullResponse += content;
    if (onChunk) onChunk(fullResponse);
  }

  return fullResponse;
};

export const analyzePrescription = async (
  prescriptionText: string,
  imageUrls: string[] = [],
  audioTranscript: string = '',
  config?: { apiKey?: string; baseUrl?: string },
  onChunk?: (chunk: string) => void
) => {
  const openai = getOpenAIClient(config);
  
  const userContent: any[] = [
    { type: 'text', text: `RESEP: ${prescriptionText}\n${audioTranscript ? `SUARA: ${audioTranscript}` : ''}` }
  ];

  imageUrls.forEach(url => {
    userContent.push({ type: 'image_url', image_url: { url } });
  });

  const stream = await openai.chat.completions.create({
    model: 'gemini/gemini-2.5-pro',
    messages: [
      {
        role: 'system',
        content: `Apoteker AI: Skrining Resep 4T 1W. 
        HANYA FOKUS PADA 3 BAGIAN BERIKUT:
        I. Tabel Ringkasan (Kesesuaian 4T 1W: Indikasi, Obat, Dosis, Pasien, Waspada)
        II. Analisis Detil & DRP (Menggunakan Kode PCNE)
        III. **Sumber Analisis & Referensi EBM** (Sebutkan Guideline Spesifik: KMK, GINA/GOLD, DiPiro, Koda-Kimble, atau Jurnal Internasional NEJM/Lancet).

        Catatan: TIDAK PERLU membuat bagian Rekomendasi/Konseling.`
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    temperature: 0.3,
    max_tokens: 4000,
    stream: true
  });

  let fullResponse = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullResponse += content;
    if (onChunk) onChunk(fullResponse);
  }

  return fullResponse;
};
