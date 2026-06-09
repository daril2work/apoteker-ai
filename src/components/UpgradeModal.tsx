import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  loading,
  onUpgrade
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="mobile-overlay active" 
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} 
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ maxWidth: '400px', width: '90%', textAlign: 'center', position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="mobile-close-btn" 
          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'block' }} 
          onClick={onClose}
        >
          <X size={20} color="#94a3b8" />
        </button>
        <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
        <h3>Batas Penggunaan Tercapai</h3>
        <p className="text-light" style={{ margin: '1rem 0' }}>
          Anda telah mencapai batas 15 dokumen skrining & Care Plan untuk penggunaan Gratis bulan ini.
        </p>
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Upgrade ke Pro (Promo: Rp 49.999)</h4>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: '#475569', margin: '0 0 0 1rem', padding: 0 }}>
            <li>✓ Skrining AI Tanpa Batas (Unlimited)</li>
            <li>✓ Kemampuan Export PDF Laporan</li>
            <li>✓ Histori Data Disimpan selama 1 Tahun</li>
            <li>✓ Dapat Memproses Resep Kompleks via Gambar</li>
          </ul>
        </div>
        <button 
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center' }} 
          disabled={loading} 
          onClick={onUpgrade}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Upgrade Sekarang (Rp 49.999)'}
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
