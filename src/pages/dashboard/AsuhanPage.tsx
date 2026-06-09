import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Loader2, Copy, Printer } from 'lucide-react';
import { analyzeConsultation } from '../../services/aiService';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import type { ConsultationRecord } from '../../store/usePharmacyStore';
import MarkdownRenderer from '../../components/MarkdownRenderer';

interface AsuhanPageProps {
  onShowUpgradeModal: () => void;
}

export const AsuhanPage: React.FC<AsuhanPageProps> = ({ onShowUpgradeModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { addConsultation, tier, usageCountThisMonth, user } = usePharmacyStore();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientInfo, setPatientInfo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');

  // Hydrate form if opened from history
  useEffect(() => {
    if (location.state) {
      const item = location.state as ConsultationRecord;
      setPatientName(item.patientName || '');
      setPatientInfo(item.patientInfo || '');
      setDiagnosis(item.diagnosis || '');
      setPrescription(item.prescription || '');
      setSubjective(item.subjective || '');
      setObjective(item.objective || '');
      setResult(item.result || null);
    }
  }, [location.state]);

  const checkLimit = () => {
    if (tier === 'free' && usageCountThisMonth >= 15) {
      onShowUpgradeModal();
      return false;
    }
    return true;
  };

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkLimit()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeConsultation(
        prescription,
        patientInfo,
        subjective,
        objective,
        diagnosis,
        undefined,
        (chunk) => setResult(chunk)
      );

      if (data) {
        setResult(data + "\n\n---\n*--- akhir analisis ---*");
        const newRecord: ConsultationRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('id-ID'),
          patientName,
          patientInfo,
          diagnosis,
          prescription,
          subjective,
          objective,
          result: data
        };
        addConsultation(newRecord);
      } else {
        throw new Error("AI tidak memberikan respon.");
      }
    } catch (error: any) {
      console.error("Care Plan Error:", error);
      if (error.message === 'LIMIT_REACHED') {
        onShowUpgradeModal();
      } else {
        alert("Error: " + (error.message || "Gagal menghubungi AI"));
        setResult("Maaf, terjadi kesalahan: " + (error.message || "Koneksi terputus"));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setResult(null);
    setPatientName('');
    setPatientInfo('');
    setDiagnosis('');
    setPrescription('');
    setSubjective('');
    setObjective('');
    // Clear router state
    navigate('/asuhan', { replace: true, state: null });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      {!result && (
        <div className="card">
          <form onSubmit={handleAnalysis}>
            <div className="form-group">
              <label>Informasi Pasien Dasar</label>
              <input
                type="text"
                placeholder="Nama Pasien / No. RM (Opsional)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <textarea
                  rows={2}
                  placeholder="Umur, BB, Riwayat Penyakit/Alergi..."
                  value={patientInfo}
                  onChange={(e) => setPatientInfo(e.target.value)}
                  required
                />
                <textarea
                  rows={2}
                  placeholder="Diagnosis Utama (Wajib)..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Review Resep (Skrining)</label>
              <textarea
                rows={3}
                placeholder="Masukkan nama obat, dosis, dan aturan pakai..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Subjective (Poin Keluhan)</label>
                <textarea
                  rows={4}
                  placeholder="Poin-poin S..."
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Objective (Data Vital/Lab)</label>
                <textarea
                  rows={4}
                  placeholder="Poin-poin O..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              Proses Konsultasi Terpadu
            </button>

            <button type="button" className="btn-outline" onClick={clearForm} style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}>
              Reset Form
            </button>
          </form>
        </div>
      )}

      {result && (
        <div className="result-area" id="printable-result">
          <div className="result-header no-print">
            <h3>Hasil Analisis & Draf SOAP</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-outline" onClick={clearForm}>
                Reset
              </button>
              <button className="btn-outline" onClick={() => {
                navigator.clipboard.writeText(result);
                alert("Hasil berhasil disalin ke clipboard!");
              }}>
                <Copy size={18} />
                Salin
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer size={18} />
                {tier === 'pro' ? 'Cetak Laporan PDF (Pro)' : 'Cetak Laporan (Basic)'}
              </button>
            </div>
          </div>

          {/* Print Header (Only visible when printing) */}
          <div className="print-header" style={{ display: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#000' }}>{user?.user_metadata?.puskesmas || 'FarmasiKu Report'}</h1>
                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Dokumen Asuhan Kefarmasian (Care Plan)</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Tgl: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          </div>

          <MarkdownRenderer content={result} />

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
              Laporan ini dihasilkan secara otomatis oleh FarmasiKu AI.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsuhanPage;
