import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { usePharmacyStore } from '../../store/usePharmacyStore';

interface PengaturanPageProps {
  onShowUpgradeModal: () => void;
}

export const PengaturanPage: React.FC<PengaturanPageProps> = ({ onShowUpgradeModal }) => {
  const { apiKey, baseUrl, setConfig, tier, usageCountThisMonth, user } = usePharmacyStore();

  const [loading, setLoading] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'subscription'>('profile');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editSipa, setEditSipa] = useState('');
  const [editPuskesmas, setEditPuskesmas] = useState('');

  const startEditing = () => {
    setEditFullName(user?.user_metadata?.full_name || '');
    setEditSipa(user?.user_metadata?.sipa || '');
    setEditPuskesmas(user?.user_metadata?.puskesmas || '');
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName,
          sipa: editSipa,
          puskesmas: editPuskesmas
        }
      });
      if (error) throw error;
      alert("Profil berhasil diperbarui!");
      setIsEditingProfile(false);
      // Reload user data
      usePharmacyStore.getState().loadUserData();
    } catch (err: any) {
      alert("Gagal memperbarui profil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '2rem', 
            fontWeight: 'bold',
            margin: '0 auto 1rem'
          }}>
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <h2 style={{ color: 'var(--primary)' }}>{user?.user_metadata?.full_name || 'Apoteker'}</h2>
          <p className="text-light">{user?.email}</p>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            className={`text-light ${settingsSubTab === 'profile' ? 'active-tab-underlined' : ''}`}
            onClick={() => setSettingsSubTab('profile')}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '0.5rem 0', 
              cursor: 'pointer', 
              fontWeight: settingsSubTab === 'profile' ? 600 : 400,
              borderBottom: settingsSubTab === 'profile' ? '2px solid var(--primary)' : 'none',
              color: settingsSubTab === 'profile' ? 'var(--primary)' : 'var(--text-light)'
            }}
          >
            Profil Saya
          </button>
          <button 
            className={`text-light ${settingsSubTab === 'subscription' ? 'active-tab-underlined' : ''}`}
            onClick={() => setSettingsSubTab('subscription')}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '0.5rem 0', 
              cursor: 'pointer', 
              fontWeight: settingsSubTab === 'subscription' ? 600 : 400,
              borderBottom: settingsSubTab === 'subscription' ? '2px solid var(--primary)' : 'none',
              color: settingsSubTab === 'subscription' ? 'var(--primary)' : 'var(--text-light)'
            }}
          >
            Status Langganan
          </button>
        </div>

        {settingsSubTab === 'profile' ? (
          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>Informasi Keprofesian</h4>
              {!isEditingProfile && (
                <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={startEditing}>
                  Edit Profil
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Nama Lengkap & Gelar</label>
                  <input 
                    type="text" 
                    value={editFullName} 
                    onChange={e => setEditFullName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>No. SIPA</label>
                  <input 
                    type="text" 
                    value={editSipa} 
                    onChange={e => setEditSipa(e.target.value)} 
                    placeholder="G/SIPA/..."
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Instansi/Puskesmas</label>
                  <input 
                    type="text" 
                    value={editPuskesmas} 
                    onChange={e => setEditPuskesmas(e.target.value)} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Perubahan'}
                  </button>
                  <button type="button" className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsEditingProfile(false)}>
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-light">No. SIPA:</span>
                  <span style={{ fontWeight: 600 }}>{user?.user_metadata?.sipa || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-light">Instansi/Puskesmas:</span>
                  <span style={{ fontWeight: 600 }}>{user?.user_metadata?.puskesmas || '-'}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="settings-section">
            <h4 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Detail Paket Langganan</h4>
            <div className="card" style={{ backgroundColor: tier === 'pro' ? '#f0fdf4' : '#f8fafc', borderColor: tier === 'pro' ? '#bbf7d0' : '#e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: tier === 'pro' ? '#166534' : 'var(--primary)' }}>{tier === 'pro' ? 'PAID PRO PLAN' : 'FREE STARTER PLAN'}</h3>
                  <p className="text-light" style={{ fontSize: '0.85rem' }}>
                    {tier === 'pro' ? 'Akses tak terbatas ke semua fitur.' : 'Limit 15 dokumen skrining & Care Plan per bulan.'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '50px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    backgroundColor: tier === 'pro' ? '#22c55e' : '#cbd5e1',
                    color: 'white'
                  }}>
                    {tier === 'pro' ? 'ACTIVE' : 'DEFAULT'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-light">Penggunaan Bulan Ini:</span>
                <span style={{ fontWeight: 600 }}>{usageCountThisMonth} / {tier === 'pro' ? '∞' : '15'} Dokumen</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  backgroundColor: usageCountThisMonth >= 15 && tier === 'free' ? 'var(--danger)' : 'var(--primary)', 
                  width: `${Math.min((usageCountThisMonth / 15) * 100, 100)}%` 
                }}></div>
              </div>
            </div>

            {tier === 'free' && (
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Kenapa Upgrade ke Pro?</h4>
                <ul style={{ fontSize: '0.85rem', color: '#475569', display: 'grid', gap: '0.5rem', paddingLeft: '1.2rem' }}>
                  <li>✓ **Unlimited** Skrining & Care Plan (Tanpa batas harian/bulanan).</li>
                  <li>✓ **Export PDF Terformat** (Kop Instansi & Tanda Tangan).</li>
                  <li>✓ **Pencarian Riwayat 1 Tahun** (Free hanya 30 hari).</li>
                  <li>✓ Dukungan Prioritas & Update Database Obat Terbaru.</li>
                </ul>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }} onClick={onShowUpgradeModal}>
                  Upgrade Sekarang (Promo Beta: Rp 49.999 / Bulan)
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn-outline" style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: '#fee2e2' }} onClick={handleSignOut}>
            Keluar dari Akun
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <button 
              className="text-light" 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '0.75rem', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => {
                const el = document.getElementById('api-config-section');
                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
              }}
            >
              Pengaturan API AI (Advanced)
            </button>
          </div>

          <div id="api-config-section" style={{ display: 'none', marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div className="form-group">
              <label>API Key Kustom</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setConfig({ apiKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Base URL Kustom</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setConfig({ baseUrl: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengaturanPage;
