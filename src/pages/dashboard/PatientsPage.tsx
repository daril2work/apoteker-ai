import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Users, Activity, FileText } from 'lucide-react';

export default function PatientsPage() {
  const { user } = usePharmacyStore();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({ totalPatients: 0, totalSessions: 0, newPatientsThisMonth: 0 });
  const [newPatient, setNewPatient] = useState({
    name: '',
    no_rm: '',
    dob: '',
    gender: 'Laki-laki',
    allergies: '',
    chronic_diseases: ''
  });

  useEffect(() => {
    if (user) {
      fetchPatientsAndStats();
    }
  }, [user]);

  const fetchPatientsAndStats = async () => {
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;
      
      const pts = patientsData || [];
      setPatients(pts);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newPts = pts.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      const { count: sessionCount, error: sessionError } = await supabase
        .from('mtm_sessions')
        .select('*', { count: 'exact', head: true });
        
      if (sessionError && sessionError.code !== 'PGRST116') {
         console.error(sessionError);
      }

      setStats({
        totalPatients: pts.length,
        totalSessions: sessionCount || 0,
        newPatientsThisMonth: newPts
      });

    } catch (err: any) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { data, error } = await supabase.from('patients').insert([
        {
          user_id: user.id,
          name: newPatient.name,
          no_rm: newPatient.no_rm,
          dob: newPatient.dob,
          gender: newPatient.gender,
          allergies: newPatient.allergies,
          chronic_diseases: newPatient.chronic_diseases
        }
      ]).select();
      if (error) throw error;
      if (data) {
        setShowAddForm(false);
        navigate(`/mtm/pasien/${data[0].id}`);
      }
    } catch (err: any) {
      alert('Gagal membuat pasien: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '12px', color: '#0284c7' }}>
            <Users size={24} />
          </div>
          <div>
            <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Total Pasien</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-color)' }}>{stats.totalPatients}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '12px', color: '#16a34a' }}>
            <User size={24} />
          </div>
          <div>
            <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Pasien Baru Bulan Ini</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-color)' }}>{stats.newPatientsThisMonth}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '12px', color: '#d97706' }}>
            <Activity size={24} />
          </div>
          <div>
            <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>Total Sesi MTM</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-color)' }}>{stats.totalSessions}</h2>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Daftar Pasien</h2>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> {showAddForm ? 'Batal' : 'Pasien Baru'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreatePatient} className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f9fafb' }}>
          <h3 style={{ marginTop: 0 }}>Tambah Pasien Baru</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Nama Pasien</label>
              <input type="text" required className="form-control" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>No. RM (Opsional)</label>
              <input type="text" className="form-control" value={newPatient.no_rm} onChange={e => setNewPatient({...newPatient, no_rm: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tanggal Lahir</label>
              <input type="date" required className="form-control" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select className="form-control" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div className="form-group">
              <label>Alergi (Kosongkan jika tidak ada)</label>
              <input type="text" className="form-control" value={newPatient.allergies} onChange={e => setNewPatient({...newPatient, allergies: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Penyakit Kronis (Pisahkan koma)</label>
              <input type="text" className="form-control" value={newPatient.chronic_diseases} onChange={e => setNewPatient({...newPatient, chronic_diseases: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Simpan Pasien</button>
        </form>
      )}

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input 
          type="text" 
          placeholder="Cari nama pasien atau No. RM..." 
          className="form-control"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat data pasien...</div>
      ) : patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px' }}>
          <User size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p className="text-light">Belum ada data pasien.</p>
          <button className="btn-outline" onClick={() => setShowAddForm(true)} style={{ marginTop: '1rem' }}>
            Tambah Pasien Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {patients.map(patient => (
            <div 
              key={patient.id} 
              className="card" 
              style={{ padding: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              onClick={() => navigate(`/mtm/pasien/${patient.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{patient.name}</h3>
                  <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>
                    No RM: {patient.no_rm || '-'} • Lahir: {patient.dob}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
