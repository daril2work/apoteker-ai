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
        content: `Apoteker AI: Laporan Pharmacist Care Plan terpadu Berbasis EBM.
        STRUKTUR WAJIB (Anda harus mengeluarkan PERSIS 4 bagian ini menggunakan header):
        ### 1. Identitas Pasien
        ### 2. Tabel Skrining 4T 1W (Singkat)
        ### 3. CPPT Terintegrasi
           (Tulis format S-O-A-P. Masukkan ringkasan Analisis DRP di bagian 'A' [Assessment]. Masukkan Monitoring Plan & Rekomendasi/Kolaborasi di bagian 'P' [Plan]. Buat sepadat mungkin agar mudah disalin ke rekam medis)
        ### 4. Referensi & Sumber EBM 

        STANDAR EBM WAJIB:
        - Layer 1 (Nasional): PMK 74/2016, KMK PPK FKTP, Fornas.
        - Layer 2-4: GINA, GOLD, ADA, AHA, DiPiro, Jurnal High-Impact.
        
        PENTING: TULIS DENGAN SANGAT SINGKAT, PADAT, MENGGUNAKAN BULLET POINTS. Hindari penjelasan panjang lebar. BATASI TOTAL RESPON MAKSIMAL 300 KATA agar tidak terjadi server timeout.`
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
