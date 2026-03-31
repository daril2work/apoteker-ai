import React from 'react';
import { Shield, BookOpen, AlertCircle, Scale, X } from 'lucide-react';

interface LegalDocsProps {
  onClose: () => void;
  initialSection?: string;
}

const LegalDocs: React.FC<LegalDocsProps> = ({ onClose, initialSection }) => {
  React.useEffect(() => {
    if (initialSection) {
      const element = document.getElementById(initialSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection]);
  return (
    <div className="legal-modal-overlay">
      <div className="legal-modal-content card">
        <div className="legal-modal-header">
          <div className="modal-title-area">
            <Shield className="text-primary" size={24} />
            <h2>Dokumen Legal FarmasiKu</h2>
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
              <li><a href="#terms-conditions">2. Syarat & Ketentuan Penggunaan Jasa</a></li>
              <li><a href="#payment-terms">3. Ketentuan Pembayaran Jasa</a></li>
              <li><a href="#copyrights">4. Hak Kekayaan Intelektual</a></li>
              <li><a href="#privacy-policy">5. Kebijakan Privasi & Hukum</a></li>
            </ul>
          </nav>

          <section id="clinical-disclaimer" className="legal-section">
            <div className="section-header">
              <AlertCircle size={22} className="text-warning" />
              <h3>1. Disclaimer Klinis (Aspek Medis & Tanggung Jawab)</h3>
            </div>
            <div className="section-content">
              <h4>1.1 Penyediaan Jasa Bantu</h4>
              <p>FarmasiKu menyediakan jasa layanan berupa alat bantu dokumentasi dan analisis farmasi untuk mendukung apoteker berlisensi dalam menjalankan praktik profesinya di fasilitas kesehatan.</p>
              
              <h4>1.2 Bukan Praktik Medis Mandiri</h4>
              <p>Layanan ini tidak menggantikan penilaian klinis, diagnosis medis, atau konsultasi tatap muka dengan tenaga kesehatan profesional. Segala saran yang dihasilkan harus ditinjau ulang oleh tenaga ahli.</p>

              <h4>1.3 Tanggung Jawab Output</h4>
              <p>Seluruh hasil analisis resep dan dokumen (SOAP/CPPT) bersifat <strong>informatif</strong>; keputusan klinis akhir adalah tanggung jawab penuh apoteker yang menggunakan jasa ini sesuai dengan kompetensi dan lisensi (SIPA) yang dimiliki.</p>

              <h4>1.4 Akurasi Materi</h4>
              <p>Penyedia jasa melakukan upaya terbaik untuk menjaga akurasi data. Namun, penyedia jasa tidak bertanggung jawab atas akurasi atau kemutakhiran konten yang telah kedaluwarsa atau dihapus dari sistem regulasi yang berlaku.</p>
            </div>
          </section>

          <section id="terms-conditions" className="legal-section">
            <div className="section-header">
              <Scale size={22} className="text-primary" />
              <h3>2. Syarat & Ketentuan Penggunaan Jasa (Service Terms)</h3>
            </div>
            <div className="section-content">
              <h4>2.1 Penerimaan Layanan</h4>
              <p>Penggunaan situs dan aplikasi ini merupakan bentuk persetujuan Anda terhadap seluruh syarat dan ketentuan jasa yang ditawarkan oleh FarmasiKu.</p>
              
              <h4>2.2 Pendaftaran Akun</h4>
              <p>Untuk memesan dan menggunakan jasa layanan, Anda wajib melakukan pendaftaran dengan informasi yang akurat, lengkap, dan terkini (termasuk No. SIPA yang valid).</p>

              <h4>2.3 Kerahasiaan Kredensial</h4>
              <p>Anda bertanggung jawab penuh atas kerahasiaan username/password serta seluruh aktivitas yang dilakukan melalui akun Anda dalam menggunakan jasa kami.</p>

              <h4>2.4 Modifikasi Layanan</h4>
              <p>Penyedia jasa berhak mengubah, memperbarui, atau menghentikan bagian dari layanan, termasuk menyesuaikan harga jasa dari waktu ke waktu dengan pemberitahuan melalui platform.</p>
            </div>
          </section>

          <section id="payment-terms" className="legal-section">
            <div className="section-header">
              <Shield size={22} className="text-secondary" />
              <h3>3. Ketentuan Pembayaran Jasa</h3>
            </div>
            <div className="section-content">
              <h4>3.1 Koreksi Biaya</h4>
              <p>Jika terjadi kesalahan harga pada sistem pemesanan jasa akibat kesalahan teknis atau informasi, penyedia layanan berhak untuk menolak atau membatalkan pesanan tersebut.</p>
              
              <h4>3.2 Metode Pembayaran</h4>
              <p>Pembayaran dilakukan melalui kanal yang tersedia (seperti Midtrans) sesuai dengan instruksi yang diberikan pada saat pemesanan jasa. Konfirmasi pembayaran dilakukan secara otomatis oleh sistem.</p>
            </div>
          </section>

          <section id="copyrights" className="legal-section">
            <div className="section-header">
              <BookOpen size={22} className="text-primary" />
              <h3>4. Hak Kekayaan Intelektual (Copyrights)</h3>
            </div>
            <div className="section-content">
              <h4>4.1 Kepemilikan Merek</h4>
              <p>Seluruh materi, logo, desain antarmuka, dan merek dagang dalam situs ini adalah milik penyedia jasa FarmasiKu dan dilindungi oleh hukum hak cipta serta kekayaan intelektual di Indonesia.</p>
              
              <h4>4.2 Pembatasan Reproduksi</h4>
              <p>Materi yang dipublikasikan atau dihasilkan dalam pemberian jasa tidak boleh disalin, didistribusikan, atau dikomersialkan oleh pihak lain tanpa izin tertulis dari penyedia jasa.</p>
            </div>
          </section>

          <section id="privacy-policy" className="legal-section">
            <div className="section-header">
              <Shield size={22} className="text-primary" />
              <h3>5. Kebijakan Privasi & Hukum</h3>
            </div>
            <div className="section-content">
              <h4>5.1 Keamanan Informasi</h4>
              <p>Informasi pribadi Anda hanya digunakan untuk kepentingan penyelesaian pesanan jasa, verifikasi profesi, dan peningkatan layanan. Kami menjamin data Anda tidak akan dijual kepada pihak ketiga tanpa izin.</p>
              
              <h4>5.2 Komunikasi Elektronik</h4>
              <p>Dengan mendaftar, Anda setuju untuk menerima email terkait informasi perubahan jasa, laporan penggunaan, penambahan fitur, atau penawaran khusus lainnya.</p>

              <h4>5.3 Hukum yang Berlaku</h4>
              <p>Seluruh ketentuan pemberian jasa ini tunduk pada hukum yang berlaku di <strong>Republik Indonesia</strong>. Perselisihan akan diselesaikan secara musyawarah atau melalui yurisdiksi hukum yang relevan di Indonesia.</p>
            </div>
          </section>
        </div>        <div className="legal-modal-footer">
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalDocs;
;
