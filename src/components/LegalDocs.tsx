import React from 'react';
import { Shield, BookOpen, AlertCircle, Scale, X } from 'lucide-react';

interface LegalDocsProps {
  onClose: () => void;
}

const LegalDocs: React.FC<LegalDocsProps> = ({ onClose }) => {
  return (
    <div className="legal-modal-overlay">
      <div className="legal-modal-content card">
        <div className="legal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield className="text-primary" size={24} />
            <h2 style={{ margin: 0 }}>Dokumen Legal FarmasiKu</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="legal-modal-body">
          <div className="legal-info-banner">
            <AlertCircle size={20} />
            <span>Versi 1.0 — Maret 2026 | Berlaku untuk semua pengguna FarmasiKu</span>
          </div>

          <nav className="legal-toc">
            <h3>Daftar Isi</h3>
            <ul>
              <li><a href="#clinical-disclaimer">1. Disclaimer Klinis</a></li>
              <li><a href="#privacy-policy">2. Kebijakan Privasi</a></li>
              <li><a href="#terms-conditions">3. Syarat & Ketentuan</a></li>
            </ul>
          </nav>

          <section id="clinical-disclaimer" className="legal-section">
            <div className="section-header">
              <AlertCircle size={22} className="text-warning" />
              <h3>1. Disclaimer Klinis</h3>
            </div>
            <div className="section-content">
              <h4>1.1 Pernyataan Umum</h4>
              <p>FarmasiKu adalah <strong>alat bantu dokumentasi dan analisis farmasi</strong> yang dirancang untuk mendukung pekerjaan apoteker berlisensi di fasilitas kesehatan tingkat pertama (FKTP), termasuk puskesmas.</p>
              <div className="highlight-box">
                <strong>FarmasiKu bukan:</strong>
                <ul>
                  <li>Pengganti penilaian klinis apoteker</li>
                  <li>Sistem diagnosis medis</li>
                  <li>Sumber rekomendasi terapi yang berdiri sendiri</li>
                  <li>Pengganti konsultasi dengan tenaga kesehatan profesional</li>
                </ul>
              </div>

              <h4>1.2 Tanggung Jawab Klinis</h4>
              <p>Seluruh output yang dihasilkan oleh FarmasiKu — termasuk hasil skrining resep, analisis interaksi obat, dokumen SOAP, CPPT, dan Pharmacist Care Plan — bersifat <strong>informatif dan sebagai bahan pertimbangan</strong> semata.</p>
              <p><strong>Keputusan klinis akhir sepenuhnya merupakan tanggung jawab apoteker pengguna</strong> yang memiliki Surat Izin Praktik Apoteker (SIPA) yang sah sesuai peraturan perundang-undangan yang berlaku di Indonesia.</p>

              <h4>1.3 Batasan Sistem AI</h4>
              <p>Pengguna memahami dan menyetujui bahwa:</p>
              <ul>
                <li>Output AI dapat mengandung ketidakakuratan atau kekeliruan</li>
                <li>Sistem AI tidak menggantikan pengetahuan klinis, pengalaman, dan pertimbangan profesional apoteker</li>
                <li>FarmasiKu tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan output tanpa verifikasi oleh apoteker yang kompeten</li>
                <li>Basis pengetahuan AI memiliki batas waktu pembaruan dan mungkin belum mencakup regulasi atau guideline terbaru</li>
              </ul>

              <h4>1.4 Penggunaan yang Dianjurkan</h4>
              <p>FarmasiKu dirancang untuk digunakan sebagai:</p>
              <ul>
                <li>Alat bantu skrining awal yang kemudian diverifikasi oleh apoteker</li>
                <li>Template dokumentasi CPPT yang disesuaikan dengan kondisi aktual pasien</li>
                <li>Referensi interaksi obat yang dikonfirmasi dengan sumber resmi (Stockley's, MIMS, dll.)</li>
                <li>Sarana efisiensi dokumentasi, bukan otomatisasi keputusan klinis</li>
              </ul>

              <h4>1.5 Kepatuhan terhadap Regulasi Profesi</h4>
              <p>Pengguna wajib memastikan penggunaan FarmasiKu tetap sesuai dengan:</p>
              <ul>
                <li>Permenkes No. 74 Tahun 2016 tentang Standar Pelayanan Kefarmasian di Puskesmas</li>
                <li>Kode Etik Apoteker Indonesia</li>
                <li>Peraturan dan pedoman yang ditetapkan oleh Ikatan Apoteker Indonesia (IAI)</li>
                <li>Regulasi FKTP yang berlaku di wilayah masing-masing</li>
              </ul>
            </div>
          </section>

          <section id="privacy-policy" className="legal-section">
            <div className="section-header">
              <BookOpen size={22} className="text-primary" />
              <h3>2. Kebijakan Privasi</h3>
            </div>
            <div className="section-content">
              <p><em>Terakhir diperbarui: Maret 2026</em></p>
              <h4>2.1 Pendahuluan</h4>
              <p>FarmasiKu berkomitmen untuk melindungi privasi pengguna dan kerahasiaan data yang dipercayakan kepada kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data Anda sesuai dengan <strong>Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022 (UU PDP)</strong>.</p>
              
              <h4>2.2 Data yang Kami Kumpulkan</h4>
              <h5>Data Akun Pengguna</h5>
              <ul>
                <li>Nama lengkap dan gelar profesi</li>
                <li>Alamat email</li>
                <li>Nomor SIPA (Surat Izin Praktik Apoteker)</li>
                <li>Nama fasilitas kesehatan tempat bertugas</li>
              </ul>

              <h5>Data Klinis (Opsional)</h5>
              <p>Informasi pasien, catatan SOAP/CPPT, dan daftar obat. <strong>Catatan:</strong> Kami menganjurkan penggunaan inisial atau nomor rekam medis untuk menjaga privasi pasien.</p>

              <h4>2.3 Penggunaan Data</h4>
              <p>Data digunakan untuk menyediakan layanan, memproses permintaan AI, mengelola akun, dan mematuhi kewajiban hukum.</p>

              <h4>2.4 Berbagi Data</h4>
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Pihak Ketiga</th>
                    <th>Tujuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google (Gemini)</td>
                    <td>Pemrosesan AI (Data klinis anonim)</td>
                  </tr>
                  <tr>
                    <td>Supabase</td>
                    <td>Penyimpanan database terenkripsi</td>
                  </tr>
                  <tr>
                    <td>Midtrans</td>
                    <td>Pemrosesan pembayaran aman</td>
                  </tr>
                </tbody>
              </table>

              <h4>2.5 Keamanan Data</h4>
              <p>Kami menggunakan enkripsi HTTPS/TLS untuk data saat transit dan enkripsi database untuk data tersimpan.</p>
            </div>
          </section>

          <section id="terms-conditions" className="legal-section">
            <div className="section-header">
              <Scale size={22} className="text-secondary" />
              <h3>3. Syarat & Ketentuan Penggunaan</h3>
            </div>
            <div className="section-content">
              <p><em>Terakhir diperbarui: Maret 2026</em></p>
              <h4>3.1 Penerimaan Syarat</h4>
              <p>Dengan mendaftar, Anda menyatakan memiliki SIPA yang sah dan menggunakan layanan untuk kepentingan profesional di fasilitas kesehatan yang sah.</p>
              
              <h4>3.2 Akun Pengguna</h4>
              <p>Satu akun per apoteker. Anda bertanggung jawab penuh atas keamanan kredensial akun Anda.</p>

              <h4>3.3 Langganan & Pembayaran</h4>
              <ul>
                <li><strong>Free Tier:</strong> Maksimal 15 dokumen per bulan.</li>
                <li><strong>Pro Plan (Rp 79.000/bln):</strong> Akses tanpa batas.</li>
                <li>Pembatalan dapat dilakukan kapan saja melalui dashboard.</li>
              </ul>

              <h4>3.4 Batasan Tanggung Jawab</h4>
              <p>FarmasiKu tidak bertanggung jawab atas kerugian klinis akibat penggunaan output tanpa verifikasi apoteker. Tanggung jawab maksimal tidak melebihi biaya langganan 1 bulan terakhir.</p>
            </div>
          </section>
        </div>

        <div className="legal-modal-footer">
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Saya Mengerti
          </button>
        </div>
      </div>

      <style>{`
        .legal-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .legal-modal-content {
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          background: var(--card);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .legal-modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }

        .legal-modal-body {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .legal-modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid var(--border);
          background: #f8fafc;
        }

        .legal-info-banner {
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          color: #0f766e;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }

        .legal-toc {
          background: #f1f5f9;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2.5rem;
        }

        .legal-toc h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .legal-toc ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .legal-toc a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        .legal-toc a:hover {
          text-decoration: underline;
        }

        .legal-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--border);
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text);
        }

        .section-content h4 {
          margin: 1.5rem 0 0.75rem;
          color: var(--text);
          font-size: 1.05rem;
        }

        .section-content h5 {
          margin: 1.25rem 0 0.5rem;
          color: var(--text-light);
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .section-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: var(--text-light);
        }

        .section-content ul {
          margin-bottom: 1.5rem;
          padding-left: 1.25rem;
        }

        .section-content li {
          margin-bottom: 0.5rem;
          color: var(--text-light);
          line-height: 1.6;
        }

        .highlight-box {
          background: #fef2f2;
          border-left: 4px solid var(--danger);
          padding: 1.25rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }

        .highlight-box strong {
          display: block;
          margin-bottom: 0.75rem;
          color: #991b1b;
        }

        .legal-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }

        .legal-table th, .legal-table td {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          text-align: left;
        }

        .legal-table th {
          background: #f8fafc;
          font-weight: 600;
        }

        .text-primary { color: var(--primary); }
        .text-warning { color: var(--warning); }
        .text-secondary { color: var(--secondary); }

        .btn-icon {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-light);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f1f5f9;
          color: var(--text);
        }

        /* Responsive Adjustments */
        @media (max-width: 640px) {
          .legal-modal-content {
            max-height: 100vh;
            border-radius: 0;
          }
          .legal-modal-overlay {
            padding: 0;
          }
          .legal-modal-header {
            padding: 1rem 1.5rem;
          }
          .legal-modal-body {
            padding: 1.5rem;
          }
          .legal-toc ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LegalDocs;
