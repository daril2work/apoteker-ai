import React from 'react';
import { Info, Target, Users, Award, X } from 'lucide-react';

interface AboutUsProps {
  onClose: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onClose }) => {
  return (
    <div className="legal-modal-overlay">
      <div className="legal-modal-content card">
        <div className="legal-modal-header">
          <div className="modal-title-area">
            <Info className="text-primary" size={24} />
            <h2>Tentang FarmasiKu</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="legal-modal-body">
          <div className="about-hero">
            <img 
              src="/hero-mockup.png" 
              alt="FarmasiKu Mission" 
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '2rem' }}
            />
          </div>

          <section className="legal-section">
            <div className="section-header">
              <Target size={22} className="text-primary" />
              <h3>Visi & Misi</h3>
            </div>
            <div className="section-content">
              <p>
                <strong>FarmasiKu</strong> lahir dari kebutuhan nyata di lapangan. Kami memahami bahwa Apoteker di Puskesmas memiliki peran krusial namun seringkali terhambat oleh beban administrasi dan dokumentasi yang sangat besar.
              </p>
              <p>
                Visi kami adalah menjadi <strong>asisten analitik cerdas</strong> yang memberdayakan Apoteker Indonesia untuk kembali fokus pada pelayanan klinis pasien, bukan pada kertas kerja.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <Users size={22} className="text-secondary" />
              <h3>Siapa Kami?</h3>
            </div>
            <div className="section-content">
              <p>
                Kami adalah tim kolaboratif yang terdiri dari praktisi farmasi puskesmas dan pengembang teknologi. Kami menggabungkan <em>deep domain knowledge</em> di bidang farmasi klinik dengan teknologi AI mutakhir untuk menciptakan solusi yang relevan, akurat, dan sesuai dengan regulasi di Indonesia.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <Award size={22} className="text-warning" />
              <h3>Komitmen Kami</h3>
            </div>
            <div className="section-content">
              <ul>
                <li><strong>Akurasi Klinis:</strong> Menggunakan database berbasis bukti (EBM) sebagai landasan analisis.</li>
                <li><strong>Efisiensi:</strong> Memangkas waktu dokumentasi SOAP dan CPPT hingga 80%.</li>
                <li><strong>Keamanan Data:</strong> Menjaga kerahasiaan informasi sesuai dengan standar PDP di Indonesia.</li>
              </ul>
              <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: '#f0fdfa', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f766e', fontWeight: 600 }}>Butuh bantuan atau kemitraan?</p>
                <a 
                  href="https://wa.me/628170419935" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary" 
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', backgroundColor: '#10b981', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Hubungi Admin via WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>

        <div className="legal-modal-footer">
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
