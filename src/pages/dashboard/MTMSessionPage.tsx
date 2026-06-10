import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { analyzeMTMSession } from '../../services/aiService';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { resizeImage } from '../../utils/imageUtils';
import { ArrowLeft, Loader2, Sparkles, FileText, CheckCircle, Copy, Printer, Camera, X } from 'lucide-react';

interface MTMSessionPageProps {
  onShowUpgradeModal: () => void;
}

export default function MTMSessionPage({ onShowUpgradeModal }: MTMSessionPageProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const navigate = useNavigate();
  const { user, tier } = usePharmacyStore();
  
  const [patient, setPatient] = useState<any>(null);
  const [previousSession, setPreviousSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiResultData, setAiResultData] = useState<any>(null);

  // Form State
  const [clinicalData, setClinicalData] = useState({
    subjective: '',
    objective: ''
  });
  const [medicationsData, setMedicationsData] = useState({
    currentMedications: '',
    newPrescriptions: ''
  });
  const [sessionImages, setSessionImages] = useState<string[]>([]);

  const handleAddImage = async (file: File) => {
    if (sessionImages.length >= 3) {
      alert('Maksimal 3 foto per sesi.');
      return;
    }
    const resized = await resizeImage(file);
    setSessionImages(prev => [...prev, resized]);
  };

  const handleRemoveImage = (index: number) => {
    setSessionImages(prev => prev.filter((_, i) => i !== index));
  };

  const isNewSession = id === 'baru';

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (isNewSession && patientId) {
          const { data: pData, error: pError } = await supabase.from('patients').select('*').eq('id', patientId).single();
          if (pError) throw pError;
          setPatient(pData);
          
          // Ambil sesi terakhir untuk konteks perawatan hari per hari (Visite / Rawat Inap)
          const { data: prevData } = await supabase
            .from('mtm_sessions')
            .select('*')
            .eq('patient_id', patientId)
            .order('session_date', { ascending: false })
            .limit(1)
            .single();
            
          if (prevData) setPreviousSession(prevData);
          
        } else if (!isNewSession && id) {
          const { data, error } = await supabase.from('mtm_sessions').select('*, patients(*)').eq('id', id).single();
          if (error) throw error;
          setPatient(data.patients);
          setClinicalData(data.clinical_data || { subjective: '', objective: '' });
          setMedicationsData(data.medications_data || { currentMedications: '', newPrescriptions: '' });
          if (data.mtr_result || data.cppt_result || data.map_result) {
            setAiResultData({
              mtr_result: data.mtr_result?.message || '',
              cppt_result: data.cppt_result?.message || '',
              map_result: data.map_result?.message || ''
            });
          }
        }
      } catch (err: any) {
        console.error('Error fetching context:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [id, patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patient) return;

    if (tier === 'free') {
      // Basic check, full check will be on backend
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      if (count && count >= 15) {
        onShowUpgradeModal();
        return;
      }
    }

    setSubmitting(true);
    try {
      // Log usage log first
      await supabase.from('usage_logs').insert([{ user_id: user.id, type: 'mtm_session' }]);

      // Siapkan konteks dari CPPT sebelumnya jika ada
      let historyContext = 'Ini adalah asesmen/visite pertama pasien.';
      if (previousSession && previousSession.cppt_result) {
        historyContext = `CPPT HARI SEBELUMNYA: ${previousSession.cppt_result.message}`;
      }

      // Call AI Edge Function
      const aiResult = await analyzeMTMSession(
        patient,
        clinicalData,
        medicationsData,
        historyContext,
        sessionImages
      );

      const { error } = await supabase.from('mtm_sessions').insert([{
        user_id: user.id,
        patient_id: patient.id,
        clinical_data: clinicalData,
        medications_data: medicationsData,
        mtr_result: { message: aiResult.mtr_result },
        cppt_result: { message: aiResult.cppt_result },
        map_result: { message: aiResult.map_result }
      }]).select();

      if (error) throw error;
      
      alert('Sesi MTM Berhasil diproses oleh AI!');
      setAiResultData(aiResult);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat sesi MTM...</div>;
  if (!patient) return <div style={{ padding: '2rem', textAlign: 'center' }}>Data tidak valid.</div>;

  return (
    <div>
      <button 
        className="btn-outline no-print" 
        onClick={() => navigate(`/mtm/pasien/${patient.id}`)}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none' }}
      >
        <ArrowLeft size={16} /> Kembali ke Profil Pasien
      </button>

      <div className="card no-print" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-color)', boxShadow: 'none' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Sesi MTM: {patient.name}</h3>
        <p className="text-light" style={{ margin: 0 }}>Lengkapi data keluhan dan pengobatan untuk dianalisis oleh AI.</p>
      </div>

      <form onSubmit={handleSubmit} className="no-print">
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px dashed var(--primary)' }}>
          <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)' }}>
            <Camera size={20} /> Lampiran Dokumen Medis
          </h4>
          <p className="text-light" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Lebih praktis! Langsung foto Rekam Medis (RM), Hasil Lab, atau Resep. AI akan mengekstrak informasi klinis secara otomatis. (Maks 3 foto)
          </p>
          
          <div className="upload-grid" style={{ marginBottom: '0.5rem' }}>
            {sessionImages.map((img, idx) => (
              <div key={idx} className="upload-preview" style={{ margin: 0, position: 'relative' }}>
                <img src={img} alt={`Preview ${idx+1}`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }} />
                <div className="remove-upload" onClick={() => handleRemoveImage(idx)} style={{ zIndex: 10 }}><X size={14} /></div>
              </div>
            ))}

            {sessionImages.length < 3 && (
              <div className="upload-card" style={{ padding: '1rem', height: '180px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)' }}>
                    <Camera size={20} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tambah Foto</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%', flexWrap: 'nowrap' }}>
                    <div style={{ flex: '1', minWidth: 0 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAddImage(file);
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                      />
                    </div>
                    <label 
                      htmlFor="camera-capture-input"
                      style={{ 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)',
                        background: '#ffffff', color: 'var(--primary)', flexShrink: 0
                      }}
                      title="Ambil Foto Langsung"
                    >
                      <Camera size={20} />
                    </label>
                    <input
                      id="camera-capture-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAddImage(file);
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginTop: 0 }}>Data Klinis</h4>
          <div className="form-group">
            <label>Subjektif (Keluhan Pasien)</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={clinicalData.subjective}
              onChange={(e) => setClinicalData({...clinicalData, subjective: e.target.value})}
              placeholder="Contoh: Pusing sejak 2 hari yang lalu..."
              required
            />
          </div>
          <div className="form-group">
            <label>Objektif (Tanda Vital & Lab)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={clinicalData.objective}
              onChange={(e) => setClinicalData({...clinicalData, objective: e.target.value})}
              placeholder="Contoh: TD 150/90, Nadi 80x/m..."
            />
          </div>
        </div>

        <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginTop: 0 }}>Rekonsiliasi Obat</h4>
          <div className="form-group">
            <label>Obat yang Sedang Digunakan (Termasuk OTC/Herbal)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={medicationsData.currentMedications}
              onChange={(e) => setMedicationsData({...medicationsData, currentMedications: e.target.value})}
              placeholder="Obat rutin yang dikonsumsi pasien sebelum kunjungan ini..."
            />
          </div>

          <div className="form-group">
            <label>Resep Obat Baru</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={medicationsData.newPrescriptions}
              onChange={(e) => setMedicationsData({...medicationsData, newPrescriptions: e.target.value})}
              placeholder="Ketik daftar obat baru jika tidak ada difoto..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!aiResultData && (
            <button 
              type="submit" 
              className="btn-primary no-print" 
              disabled={submitting || (sessionImages.length === 0 && !medicationsData.newPrescriptions && !medicationsData.currentMedications && !clinicalData.subjective && !clinicalData.objective)}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {submitting ? 'AI Sedang Menganalisis...' : 'Analisis MTR & Generate CPPT'}
            </button>
          )}
        </div>
      </form>

      {aiResultData && (
        <div className="result-area" id="printable-result" style={{ marginTop: '2rem' }}>
          <div className="result-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
              <CheckCircle size={24} /> Analisis Selesai
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-outline" onClick={() => {
                const text = `MTR:\n${aiResultData.mtr_result}\n\nCPPT:\n${aiResultData.cppt_result}\n\nMAP:\n${aiResultData.map_result}`;
                navigator.clipboard.writeText(text);
                alert("Hasil berhasil disalin ke clipboard!");
              }}>
                <Copy size={18} /> Salin Teks
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer size={18} /> Cetak / Download PDF
              </button>
            </div>
          </div>

          {/* Print Header (Only visible when printing) */}
          <div className="print-header" style={{ display: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#000' }}>{user?.user_metadata?.puskesmas || 'Dokumen MTM'}</h1>
                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Medication Therapy Management (MTM)</p>
                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>Pasien: {patient.name} ({patient.gender === 'male' ? 'L' : 'P'}) - RM: {patient.no_rm}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Apoteker: {user?.user_metadata?.full_name || 'Apoteker'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Tgl: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> 1. Medication Therapy Review (MTR)
            </h3>
            <MarkdownRenderer content={aiResultData.mtr_result} />
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> 2. CPPT Terintegrasi (SOAP)
            </h3>
            <MarkdownRenderer content={aiResultData.cppt_result} />
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> 3. Medication-Related Action Plan (MAP)
            </h3>
            <MarkdownRenderer content={aiResultData.map_result} />
          </div>

          {/* Print Footer */}
          <div className="print-footer" style={{ display: 'none', marginTop: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <p>Apoteker Penanggung Jawab,</p>
                <div style={{ height: '60px' }}></div>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                <p style={{ fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
              </div>
            </div>
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              Dokumen ini dicetak otomatis oleh Sistem FarmasiKu.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
