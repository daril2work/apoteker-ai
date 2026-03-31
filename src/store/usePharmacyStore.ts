import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export interface ConsultationRecord {
    id: string;
    date: string;
    patientName: string;
    patientInfo: string;
    diagnosis: string;
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

export interface PharmacyState {
    consultationHistory: ConsultationRecord[];
    screeningHistory: ScreeningRecord[];
    apiKey: string;
    baseUrl: string;
    user: User | null;
    tier: 'free' | 'pro';
    usageCountThisMonth: number;
    addConsultation: (record: ConsultationRecord) => Promise<void>;
    addScreening: (record: ScreeningRecord) => Promise<void>;
    deleteConsultation: (id: string) => Promise<void>;
    deleteScreening: (id: string) => Promise<void>;
    setConfig: (config: { apiKey?: string; baseUrl?: string }) => void;
    setUser: (user: User | null) => void;
    setTier: (tier: 'free' | 'pro') => void;
    loadUserData: () => Promise<void>;
}

export const usePharmacyStore = create<PharmacyState>()(
    persist(
        (set, get) => ({
            consultationHistory: [],
            screeningHistory: [],
            apiKey: '',
            baseUrl: '',
            user: null,
            tier: 'free',
            usageCountThisMonth: 0,
            loadUserData: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // Get usage this month
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0,0,0,0);
                
                const { count } = await supabase
                    .from('usage_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('created_at', startOfMonth.toISOString());
                    
                if (count !== null) {
                    set({ usageCountThisMonth: count });
                }

                // Load documents
                const { data: docs } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                    
                if (docs) {
                    const cHist: ConsultationRecord[] = [];
                    const sHist: ScreeningRecord[] = [];
                    docs.forEach(d => {
                        if (d.type === 'consultation') {
                            cHist.push({ ...d.input_data, id: d.id, result: d.output_data });
                        } else if (d.type === 'screening') {
                            sHist.push({ ...d.input_data, id: d.id, result: d.output_data });
                        }
                    });
                    set({ consultationHistory: cHist, screeningHistory: sHist });
                }
            },
            addConsultation: async (record) => {
                const { user } = get();
                if (user) {
                    const { id, result, ...input_data } = record;
                    const { data } = await supabase.from('documents').insert({
                        user_id: user.id,
                        type: 'consultation',
                        input_data,
                        output_data: result
                    }).select();
                    
                    await supabase.from('usage_logs').insert({
                        user_id: user.id,
                        type: 'consultation'
                    });
                    
                    const realId = data?.[0]?.id || id;
                    const newRecord = { ...record, id: realId };
                    
                    set((state) => ({
                        consultationHistory: [newRecord, ...state.consultationHistory],
                        usageCountThisMonth: state.usageCountThisMonth + 1
                    }));
                } else {
                    set((state) => ({
                        consultationHistory: [record, ...state.consultationHistory],
                    }));
                }
            },
            addScreening: async (record) => {
                const { user } = get();
                if (user) {
                    const { id, result, ...input_data } = record;
                    const { data } = await supabase.from('documents').insert({
                        user_id: user.id,
                        type: 'screening',
                        input_data,
                        output_data: result
                    }).select();
                    
                    await supabase.from('usage_logs').insert({
                        user_id: user.id,
                        type: 'screening'
                    });
                    
                    const realId = data?.[0]?.id || id;
                    const newRecord = { ...record, id: realId };
                    
                    set((state) => ({
                        screeningHistory: [newRecord, ...state.screeningHistory],
                        usageCountThisMonth: state.usageCountThisMonth + 1
                    }));
                } else {
                    set((state) => ({
                        screeningHistory: [record, ...state.screeningHistory],
                    }));
                }
            },
            deleteConsultation: async (id) => {
                const { user } = get();
                if (user) {
                    await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
                }
                set((state) => ({
                    consultationHistory: state.consultationHistory.filter((r) => r.id !== id),
                }));
            },
            deleteScreening: async (id) => {
                const { user } = get();
                if (user) {
                    await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
                }
                set((state) => ({
                    screeningHistory: state.screeningHistory.filter((r) => r.id !== id),
                }));
            },
            setConfig: (config) =>
                set((state) => ({
                    ...state,
                    ...config,
                })),
            setUser: (user) => set({ user }),
            setTier: (tier) => set({ tier }),
        }),
        {
            name: 'pharmacy-storage',
            partialize: (state) => ({ 
                apiKey: state.apiKey, 
                baseUrl: state.baseUrl 
            }), // Only persist config locally, don't persist history locally since it's in Supabase now
        }
    )
);
