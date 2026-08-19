import { supabase } from './supabase';

// Helper: get current session token for authorized Edge Function calls
const getSessionToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
  return session.access_token;
};

// Base URL for Supabase Edge Functions (from env, no API key exposed)
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Analyze consultation via secure Supabase Edge Function.
 * AI API key is stored server-side only — never exposed to browser.
 */
export const analyzeConsultation = async (
  prescriptionData: string,
  patientInfo: string,
  subjective: string,
  objective: string,
  diagnosis: string,
  _config?: { apiKey?: string; baseUrl?: string }, // kept for backward compat, ignored
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const token = await getSessionToken();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/analyze-consultation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      prescriptionData,
      patientInfo,
      subjective,
      objective,
      diagnosis,
    }),
  });

  if (response.status === 429) {
    throw new Error("LIMIT_REACHED");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  const result: string = data.result || '';

  // Simulate streaming for UI compatibility: deliver full result at once
  if (onChunk) onChunk(result);

  return result;
};

/**
 * Analyze prescription via secure Supabase Edge Function.
 * AI API key is stored server-side only — never exposed to browser.
 */
export const analyzePrescription = async (
  prescriptionText: string,
  imageUrls: string[] = [],
  audioTranscript: string = '',
  _config?: { apiKey?: string; baseUrl?: string }, // kept for backward compat, ignored
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const token = await getSessionToken();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/analyze-screening`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      prescriptionText,
      imageUrls,
      audioTranscript,
    }),
  });

  if (response.status === 429) {
    throw new Error("LIMIT_REACHED");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.detail ? `${errorData.error}: ${errorData.detail}` : errorData.error;
    throw new Error(errorMsg || `Server error ${response.status}`);
  }

  const data = await response.json();
  const result: string = data.result || '';

  // Simulate streaming for UI compatibility
  if (onChunk) onChunk(result);

  return result;
};

/**
 * Analyze MTM Session via secure Supabase Edge Function.
 * AI returns JSON object containing MTR, CPPT, and MAP.
 */
export const analyzeMTMSession = async (
  patientData: any,
  clinicalData: any,
  medicationsData: any,
  historyContext: string = '',
  imageUrls: string[] = []
): Promise<{ mtr_result: string; cppt_result: string; map_result: string }> => {
  const token = await getSessionToken();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/analyze-mtm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      patientData,
      clinicalData,
      medicationsData,
      historyContext,
      imageUrls
    }),
  });

  if (response.status === 429) {
    throw new Error("LIMIT_REACHED");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  const rawResult = data.result || '{}';
  
  try {
    const jsonResult = JSON.parse(rawResult);
    return {
      mtr_result: jsonResult.mtr_result || 'Gagal generate MTR',
      cppt_result: jsonResult.cppt_result || 'Gagal generate CPPT',
      map_result: jsonResult.map_result || 'Gagal generate MAP',
    };
  } catch (err) {
    console.error("Failed to parse AI JSON:", rawResult);
    throw new Error("AI mengembalikan format yang tidak valid.");
  }
};
