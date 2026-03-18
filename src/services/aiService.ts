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
  config?: { apiKey?: string; baseUrl?: string }
) => {
  const openai = getOpenAIClient(config);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Anda adalah asisten apoteker klinis ahli untuk setting Puskesmas/FKTP.
        Tugas Anda adalah membuat laporan terpadu (Skrining & SOAP) dengan standar EBM (Evidence-Based Medicine) yang sangat ketat.
        
        Aturan Prioritas Literatur (Mandatory):
        1. **Nasional (Puskesmas)**: Fornas, Permenkes 74/2016, dan KMK Panduan Praktik Klinis FKTP 2022.
        2. **Kardiovaskular**: Pedoman Kemenkes FKTP 2024, Konsensus PERHI (InaSH) 2021/2024, Pedoman PERKI, serta standar internasional **AHA/ACC** dan **ESC**.
        3. **Spesifik Penyakit (Internasional)**: Wajib merujuk pada **GINA** (Asma), **GOLD** (PPOK), **ADA** (Diabetes), dan **IDSA/SANFORD** (Infeksi/Antibiotik).
        4. **Golden Standard**: Stockley's Drug Interactions (Interaksi) dan DiPiro's Pharmacotherapy (Terapi).
        
        Guardrail Klinis & Keamanan:
        - **Refusal Logic**: Jika data dosis tidak ditemukan di EBM atau di luar rentang aman, JANGAN menebak. Tulis "Perlu Verifikasi Manual" dan beri label [KRITIS].
        - **Vulnerable Groups**: Wajib melakukan cek keamanan dosis khusus untuk **Pediatrik** (Berat Badan) dan **Geriatrik** (Fungsi Ginjal/Beer's Criteria).
        - **Dilarang**: JANGAN gunakan MIMS, ISO, OOP, blog, atau sumber tak terverifikasi lainnya.
        
        Struktur Laporan:
        # Laporan Konsultasi Apoteker FKTP
        ## I. Skrining Klinis (Keamanan & Interaksi)
        ## II. Dokumentasi SOAP (Subjective, Objective, Assessment, Plan)
        ## III. Catatan Perkembangan Pasien Terintegrasi (CPPT)
        [Buat format CPPT yang siap disalin Apoteker ke rekam medis, merangkum hasil analisis dan SOAP secara ringkas dan terstruktur]
        ## IV. Referensi & Evidence Base (Sebutkan rujukan spesifik yang digunakan)
        
        FORMAT BERSIH: Langsung mulai dengan teks Markdown.`
      },
      {
        role: 'user',
        content: `DATA PASIEN: ${patientInfo}
        KELUHAN (Subjective): ${subjective}
        DATA VITAL/LAB (Objective): ${objective}
        RESEP (Isi Obat): ${prescriptionData}`
      }
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
};

export const analyzePrescription = async (
  prescriptionText: string,
  imageUrls: string[] = [],
  audioTranscript: string = '',
  config?: { apiKey?: string; baseUrl?: string }
) => {
  const openai = getOpenAIClient(config);
  const messages: any[] = [
    {
      role: 'system',
      content: `Anda adalah asisten apoteker klinis FKTP spesialis Skrining Resep & DRP.
      
      Aturan Rujukan Klinis (Wajib Kombinasi Nasional & Internasional):
      1. **Kardiovaskular**: Kemenkes FKTP 2024, PERHI, PERKI, dan **AHA/ACC**.
      2. **Penyakit Kronis/Infeksi**: **GINA**, **GOLD**, **ADA**, dan **IDSA**.
      3. **Standar Farmasi**: Fornas, Permenkes 74/2016, dan Stockley's Drug Interactions.
      4. **EBM**: Jurnal Open Access (IJCP, IJP UGM, PubMed Central).
      
      Aturan Keamanan (Guardrails):
      - **Pediatrik/Geriatrik**: Wajib screening dosis khusus kelompok rentan.
      - **Ketidakpastian**: JANGAN menebak. Jika ambigu, beri label [KRITIS] "Konfirmasi ke Penulis Resep".
      - **Kode PCNE**: Wajib sertakan kode PCNE v9.00 (P, C, I, O).
      
      STRUKTUR LAPORAN:
      # Laporan Skrining Resep Terpadu
      ## I. Skrining Administratif (Tabel)
      ## II. Skrining Farmasetik
      ## III. Analisis Klinis & DRP (PCNE V9.00)
      ## IV. Rekomendasi Intervensi & Solusi
      ## V. Referensi & Evidence Base
      
      FORMAT: Langsung output Markdown tanpa wrapper.`
    }
  ];

  let userContent: any[] = [
    { type: 'text', text: `RESEP/INPUT: ${prescriptionText}\n${audioTranscript ? `TRANSKRIP SUARA: ${audioTranscript}` : ''}` }
  ];

  imageUrls.forEach(url => {
    userContent.push({ type: 'image_url', image_url: { url } });
  });

  messages.push({ role: 'user', content: userContent });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
};
