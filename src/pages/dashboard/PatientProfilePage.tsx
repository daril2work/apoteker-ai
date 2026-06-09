import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { ArrowLeft, Plus, FileText, AlertTriangle, Calendar } from 'lucide-react';

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = usePharmacyStore();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthYear: string) => {
    setOpenMonths(prev => ({ ...prev, [monthYear]: !prev[monthYear] }));
  };

  useEffect(() => {
    if (user && id) {
      fetchPatientData();
    }
  }, [user, id]);

  const fetchPatientData = async () => {
    try {
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('mtm_sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false });

      if (sessionError) throw sessionError;
      
      const loadedSessions = sessionData || [];
      setSessions(loadedSessions);

      if (loadedSessions.length > 0) {
        const firstMonth = new Date(loadedSessions[0].session_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        setOpenMonths(prev => Object.keys(prev).length === 0 ? { [firstMonth]: true } : prev);
      }

    } catch (err: any) {
      console.error('Error fetching patient data:', err.message);
      alert('Gagal mengambil data pasien.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat profil...</div>;
  if (!patient) return <div style={{ padding: '2rem', textAlign: 'center' }}>Pasien tidak ditemukan.</div>;

  return (
    <div>
      <button 
        className="btn-outline" 
        onClick={() => navigate('/mtm')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none' }}
      >
        <ArrowLeft size={16} /> Kembali ke Daftar
      </button>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Profil PMR Pasien</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <p className="text-light" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Nama Lengkap</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{patient.name}</p>
          </div>
          <div>
            <p className="text-light" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>No. Rekam Medis</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{patient.no_rm || '-'}</p>
          </div>
          <div>
            <p className="text-light" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Tanggal Lahir / Usia</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{patient.dob}</p>
          </div>
          <div>
            <p className="text-light" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Jenis Kelamin</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{patient.gender}</p>
          </div>
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', marginBottom: '0.5rem', fontWeight: 600 }}>
            <AlertTriangle size={18} /> Kondisi Khusus & Alergi
          </div>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Alergi:</strong> {patient.allergies || 'Tidak ada catatan alergi'}</p>
          <p style={{ margin: 0 }}><strong>Penyakit Kronis:</strong> {patient.chronic_diseases || 'Tidak ada catatan penyakit penyerta'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Riwayat Sesi MTM</h3>
        <button 
          className="btn-primary" 
          onClick={() => navigate(`/mtm/sesi/baru?patientId=${patient.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Mulai Sesi MTM Baru
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-color)', boxShadow: 'none' }}>
          <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p className="text-light">Belum ada riwayat sesi MTM untuk pasien ini.</p>
        </div>
      ) : (
        <div>
          {Object.entries(
            sessions.reduce((acc: Record<string, any[]>, session: any) => {
              const monthYear = new Date(session.session_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              if (!acc[monthYear]) acc[monthYear] = [];
              acc[monthYear].push(session);
              return acc;
            }, {})
          ).map(([monthYear, monthSessions]: [string, any]) => (
            <div key={monthYear} style={{ marginBottom: '2.5rem' }}>
              <div 
                onClick={() => toggleMonth(monthYear)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, userSelect: 'none' }}
              >
                {monthYear} <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>{monthSessions.length} Visite</span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateRows: openMonths[monthYear] ? '1fr' : '0fr', 
                transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.5rem', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
                    {monthSessions.map((session: any) => (
                      <div key={session.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                        {/* Titik Timeline */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-1.95rem', 
                          top: '1.5rem', 
                          width: '14px', 
                          height: '14px', 
                          borderRadius: '50%', 
                          backgroundColor: session.cppt_result ? 'var(--success)' : 'var(--warning)', 
                          border: '3px solid white',
                          boxShadow: '0 0 0 1px var(--border-color)'
                        }}></div>
                        
                        <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Visite / Sesi MTM
                              </h4>
                              <p className="text-light" style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} /> 
                                {new Date(session.session_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {' - '}
                                {new Date(session.session_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </p>
                            </div>
                            <button 
                              className="btn-outline"
                              onClick={() => navigate(`/mtm/sesi/${session.id}`)}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)' }}
                            >
                              Buka Detail CPPT
                            </button>
                          </div>
                          
                          {session.clinical_data?.subjective && (
                            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', borderLeft: '3px solid var(--border-color)' }}>
                              <p style={{ margin: '0 0 0.5rem 0' }}><strong>S (Subjektif):</strong> <span className="text-light">{session.clinical_data.subjective}</span></p>
                              <p style={{ margin: 0 }}><strong>O (Objektif):</strong> <span className="text-light">{session.clinical_data.objective || '-'}</span></p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
