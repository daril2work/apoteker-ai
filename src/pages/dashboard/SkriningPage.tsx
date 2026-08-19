import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Mic, FileText, Loader2, Copy, Printer, X, MonitorUp } from 'lucide-react';
import { analyzePrescription } from '../../services/aiService';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import type { ScreeningRecord } from '../../store/usePharmacyStore';
import { resizeImage } from '../../utils/imageUtils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import MarkdownRenderer from '../../components/MarkdownRenderer';

interface SkriningPageProps {
  onShowUpgradeModal: () => void;
}

export const SkriningPage: React.FC<SkriningPageProps> = ({ onShowUpgradeModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { addScreening, screeningHistory, deleteScreening, tier, usageCountThisMonth, user } = usePharmacyStore();

  const [isScreening, setIsScreening] = useState(false);
  const [screeningInput, setScreeningInput] = useState('');
  const [screeningImage, setScreeningImage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<string | null>(null);

  // Speech Recognition Hook
  const { isListening, toggleSpeechRecognition } = useSpeechRecognition((transcript) => {
    setScreeningInput(prev => prev + (prev ? ' ' : '') + transcript);
  });

  // Hydrate state if redirected from history
  useEffect(() => {
    if (location.state) {
      const item = location.state as ScreeningRecord;
      setScreeningInput(item.prescriptionText || '');
      setScreeningImage(item.image || null);
      setScreeningResult(item.result || null);
    }
  }, [location.state]);

  // Handle global paste events (e.g., pasting a screenshot from RME)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const resized = await resizeImage(file);
            setScreeningImage(resized);
          }
          break; // only take the first image
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert canvas to image and resize for AI
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
            const resized = await resizeImage(file);
            setScreeningImage(resized);
          }
        }, 'image/jpeg', 0.9);
      }
      
      // Stop sharing immediately after capture
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Screen capture failed:", err);
      // User cancelled or error
    }
  };

  const checkLimit = () => {
    if (tier === 'free' && usageCountThisMonth >= 15) {
      onShowUpgradeModal();
      return false;
    }
    return true;
  };

  const handleStartScreening = async () => {
    if (!checkLimit()) return;
    setIsScreening(true);
    setScreeningResult(null);

    try {
      const res = await analyzePrescription(
        screeningInput,
        screeningImage ? [screeningImage] : [],
        ''
      );

      if (!res) throw new Error("AI tidak memberikan respon skrining.");
      
      setScreeningResult(res + "\n\n---\n*--- akhir analisis ---*");

      const newRecord: ScreeningRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('id-ID'),
        prescriptionText: screeningInput,
        image: screeningImage || undefined,
        result: res
      };
      addScreening(newRecord);
    } catch (err: any) {
      console.error("Screening Error:", err);
      if (err.message === 'LIMIT_REACHED') {
        onShowUpgradeModal();
      } else {
        alert("Skrining Gagal: " + (err.message || "Gagal menghubungi AI"));
        setScreeningResult("Gagal melakukan skrining: " + (err.message || "Koneksi terputus"));
      }
    } finally {
      setIsScreening(false);
    }
  };

  const clearForm = () => {
    setScreeningResult(null);
    setScreeningInput('');
    setScreeningImage(null);
    navigate('/skrining', { replace: true, state: null });
  };

  return (
    <div className="skrining-container">
      <div className="skrining-main">
        {!screeningResult ? (
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Alur Skrining Resep</h2>

            <div className="upload-grid">
              <div className="upload-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)' }}>
                    <Camera size={24} />
                    <span style={{ fontWeight: 600 }}>Foto Resep</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', width: '100%', flexWrap: 'nowrap' }}>
                    <div style={{ flex: '1', minWidth: 0 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const resized = await resizeImage(file);
                            setScreeningImage(resized);
                          }
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.setProperty('width', '100%', 'important');
                            el.style.setProperty('margin', '0', 'important');
                          }
                        }}
                        style={{ 
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <label 
                      htmlFor="camera-capture-input"
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: '#ffffff',
                        color: 'var(--primary)',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title="Ambil Foto Langsung"
                    >
                      <Camera size={24} />
                    </label>
                    <input
                      id="camera-capture-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const resized = await resizeImage(file);
                          setScreeningImage(resized);
                        }
                      }}
                      ref={(el) => { 
                        if (el) {
                          el.style.setProperty('display', 'none', 'important'); 
                          el.style.setProperty('visibility', 'hidden', 'important');
                          el.style.setProperty('position', 'absolute', 'important');
                          el.style.setProperty('width', '0', 'important');
                          el.style.setProperty('height', '0', 'important');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                className={`upload-card`}
                onClick={handleScreenCapture}
                style={{ background: 'none', cursor: 'pointer', border: 'none', padding: 0 }}
              >
                <MonitorUp size={32} color="var(--primary)" />
                <span>Tangkap Layar</span>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>Screenshot Tab RME</p>
              </button>

              <button 
                type="button" 
                className={`upload-card ${isListening ? 'listening' : ''}`}
                onClick={toggleSpeechRecognition}
                style={{ background: 'none', cursor: 'pointer', border: 'none', padding: 0 }}
              >
                <Mic size={32} color={isListening ? 'var(--danger)' : 'currentColor'} />
                <span>{isListening ? 'Mendengarkan...' : 'Input Suara'}</span>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>Klik & Bicara</p>
              </button>
            </div>

            {screeningImage && (
              <div className="upload-preview">
                <img src={screeningImage} alt="Preview Resep" />
                <div className="remove-upload" onClick={() => setScreeningImage(null)}><X size={14} /></div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Input Manual (Daftar Obat/Catatan)</label>
              <textarea
                rows={5}
                placeholder="Masukkan nama obat, dosis, frekuensi, atau catatan tambahan..."
                value={screeningInput}
                onChange={(e) => setScreeningInput(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '3.5rem', fontSize: '1.1rem' }}
              disabled={isScreening || (!screeningInput && !screeningImage)}
              onClick={handleStartScreening}
            >
              {isScreening ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
              Mulai Skrining Otomatis
            </button>
          </div>
        ) : (
          <div className="result-area" id="printable-screening">
            <div className="result-header no-print">
              <h3>Hasil Skrining (PCNE v9.00)</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-outline" onClick={clearForm}>
                  Reset
                </button>
                <button className="btn-outline" onClick={() => {
                  navigator.clipboard.writeText(screeningResult);
                  alert("Hasil skrining berhasil disalin!");
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
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Hasil Skrining Resep (Metode PCNE v9.00)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Tgl: {new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            </div>

            <MarkdownRenderer content={screeningResult} />

            {/* Print Footer */}
            <div className="print-footer" style={{ display: 'none', marginTop: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <p>Pemeriksa,</p>
                  <div style={{ height: '60px' }}></div>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                  <p style={{ fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar for History */}
      <div className="skrining-sidebar no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>Riwayat Skrining</h3>
        </div>
        
        {screeningHistory.length === 0 ? (
          <div className="skrining-history-empty">
            Belum ada riwayat skrining bulan ini.
          </div>
        ) : (
          <div className="skrining-history-list">
            {screeningHistory.map((item) => (
              <div 
                key={item.id} 
                className={`skrining-history-item ${screeningResult === item.result ? 'active' : ''}`}
                onClick={() => {
                  setScreeningInput(item.prescriptionText || '');
                  setScreeningImage(item.image || null);
                  setScreeningResult(item.result || null);
                }}
              >
                <div className="history-item-date">
                  <span>{item.date.split(',')[0]}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.date.split(',')[1]?.trim()}</span>
                </div>
                <div className="history-item-content">
                  {item.prescriptionText || "Skrining dari gambar"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkriningPage;
