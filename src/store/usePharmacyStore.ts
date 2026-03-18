import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConsultationRecord {
    id: string;
    date: string;
    patientName: string;
    patientInfo: string;
    prescription: string;
    subjective: string;
    objective: string;
    result: string;
}

export interface ScreeningRecord {
    id: string;
    date: string;
    prescriptionText: string;
    image?: string;
    result: string;
}

interface PharmacyState {
    consultationHistory: ConsultationRecord[];
    screeningHistory: ScreeningRecord[];
    apiKey: string;
    baseUrl: string;
    addConsultation: (record: ConsultationRecord) => void;
    addScreening: (record: ScreeningRecord) => void;
    deleteConsultation: (id: string) => void;
    deleteScreening: (id: string) => void;
    setConfig: (config: { apiKey?: string; baseUrl?: string }) => void;
}

export const usePharmacyStore = create<PharmacyState>()(
    persist(
        (set) => ({
            consultationHistory: [],
            screeningHistory: [],
            apiKey: '',
            baseUrl: '',
            addConsultation: (record) =>
                set((state) => ({
                    consultationHistory: [record, ...state.consultationHistory],
                })),
            addScreening: (record) =>
                set((state) => ({
                    screeningHistory: [record, ...state.screeningHistory],
                })),
            deleteConsultation: (id) =>
                set((state) => ({
                    consultationHistory: state.consultationHistory.filter((r) => r.id !== id),
                })),
            deleteScreening: (id) =>
                set((state) => ({
                    screeningHistory: state.screeningHistory.filter((r) => r.id !== id),
                })),
            setConfig: (config) =>
                set((state) => ({
                    ...state,
                    ...config,
                })),
        }),
        {
            name: 'pharmacy-storage',
        }
    )
);
