import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MigrationPage() {
  const { user } = usePharmacyStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  const [done, setDone] = useState(false);

  const startMigration = async () => {
    if (!user) {
      alert("Anda harus login terlebih dahulu.");
      return;
    }

    const confirm = window.confirm("Apakah Anda yakin ingin memigrasikan data lama ke sistem baru? Proses ini aman dan tidak akan menghapus data asli.");
    if (!confirm) return;

    setLoading(true);
    setDone(false);
    setStatus('Mengambil data dokumen lama...');

    try {
      // 1. Fetch all documents for this user
      const { data: docs, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!docs || docs.length === 0) {
        setStatus('Tidak ada data dokumen lama yang ditemukan.');
        setLoading(false);
        setDone(true);
        return;
      }

      setProgress({ current: 0, total: docs.length });
      setStatus('Memproses dokumen...');

      // 2. Iterate and convert
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        
        let patientName = "Pasien Lama (Tanpa Nama)";
        let clinicalData = { subjective: '', objective: '' };
        let medicationsData = { currentMedications: '', newPrescriptions: '' };
        let resultText = doc.output_data || '';
        
        if (doc.type === 'consultation') {
          patientName = doc.input_data?.patientName || "Pasien Lama (Konsultasi)";
          clinicalData.subjective = doc.input_data?.subjective || '';
          clinicalData.objective = doc.input_data?.objective || '';
          medicationsData.currentMedications = doc.input_data?.patientInfo || '';
          medicationsData.newPrescriptions = doc.input_data?.prescription || '';
        } else if (doc.type === 'screening') {
          patientName = "Pasien Lama (Skrining)";
          medicationsData.newPrescriptions = doc.input_data?.prescriptionText || '';
        }

        setStatus(`Memproses: ${patientName}...`);

        // Check if patient exists with this exact name for this user (to group if possible)
        let patientId = null;
        const { data: existingPatients, error: pSearchError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', patientName)
          .limit(1);

        if (!pSearchError && existingPatients && existingPatients.length > 0) {
          patientId = existingPatients[0].id;
        } else {
          // Create new patient
          const { data: newPatient, error: createPError } = await supabase
            .from('patients')
            .insert([{
              user_id: user.id,
              name: patientName,
              dob: new Date().toISOString().split('T')[0], // placeholder
              gender: 'Laki-laki',
              allergies: '',
              chronic_diseases: ''
            }])
            .select('id')
            .single();
            
          if (createPError) throw createPError;
          patientId = newPatient.id;
        }

        // Create MTM Session
        if (patientId) {
          const { error: sessionError } = await supabase
            .from('mtm_sessions')
            .insert([{
              user_id: user.id,
              patient_id: patientId,
              clinical_data: clinicalData,
              medications_data: medicationsData,
              mtr_result: { message: '' },
              cppt_result: { message: resultText }, // Map old result to CPPT
              map_result: { message: '' },
              session_date: doc.created_at
            }]);

          if (sessionError) throw sessionError;
        }

        setProgress({ current: i + 1, total: docs.length });
      }

      setStatus('Proses migrasi berhasil diselesaikan!');
      setDone(true);

    } catch (err: any) {
      console.error(err);
      setStatus('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Database size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: 0, color: 'var(--primary-dark)' }}>Migrasi Data Lama</h2>
          <p className="text-light" style={{ marginTop: '0.5rem' }}>
            Pindahkan riwayat Konsultasi dan Skrining Anda dari sistem lama ke format Pasien dan Sesi MTM yang baru.
          </p>
        </div>

        <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', marginBottom: '2rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', margin: '0 0 0.5rem 0' }}>
            <AlertTriangle size={18} /> Info Penting
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
            Proses ini akan meng-copy data dari tabel lama (`documents`) ke tabel baru. Data asli tidak akan dihapus sehingga sangat aman.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          {!done && !loading && (
            <button 
              className="btn-primary" 
              onClick={startMigration}
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
            >
              Mulai Migrasi Data
            </button>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              <p style={{ fontWeight: 'bold' }}>{status}</p>
              {progress && (
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      backgroundColor: 'var(--primary)', 
                      width: `${(progress.current / progress.total) * 100}%`,
                      transition: 'width 0.3s'
                    }} 
                  />
                </div>
              )}
              {progress && (
                <p className="text-light" style={{ fontSize: '0.8rem' }}>{progress.current} dari {progress.total} dokumen</p>
              )}
            </div>
          )}

          {done && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle size={48} color="var(--success)" />
              <p style={{ fontWeight: 'bold', color: 'var(--success)' }}>{status}</p>
              <button className="btn-primary" onClick={() => navigate('/mtm')}>
                Ke Daftar Pasien Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
