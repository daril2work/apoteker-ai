import React, { useState } from 'react';
import {
  ClipboardCheck,
  Settings,
  LogOut,
  Plus,
  Printer,
  Send,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  History,
  Trash2,
  ChevronRight,
  FileSearch,
  Camera,
  Mic,
  FileText,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeConsultation, analyzePrescription, defaultApiKey, defaultBaseURL } from './services/aiService';
import { usePharmacyStore } from './store/usePharmacyStore';
import type { ConsultationRecord, ScreeningRecord } from './store/usePharmacyStore';

type Tab = 'new' | 'screening' | 'history' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientInfo, setPatientInfo] = useState('');
  const [prescription, setPrescription] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');

  // Screening States
  const [screeningInput, setScreeningInput] = useState('');
  const [screeningImage, setScreeningImage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<string | null>(null);
  const [isScreening, setIsScreening] = useState(false);

  // Zustand Store
  const {
    consultationHistory,
    screeningHistory,
    addConsultation,
    addScreening,
    deleteConsultation,
    deleteScreening,
    apiKey,
    baseUrl,
    setConfig
  } = usePharmacyStore();

  const [historySubTab, setHistorySubTab] = useState<'consultation' | 'screening'>('consultation');

  // Handlers
  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeConsultation(
        prescription,
        patientInfo,
        subjective,
        objective,
        { apiKey, baseUrl }
      );
      if (data) {
        setResult(data);
        const newRecord: ConsultationRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('id-ID'),
          patientName,
          patientInfo,
          prescription,
          subjective,
          objective,
          result: data
        };
        addConsultation(newRecord);
      }
    } catch (error) {
      console.error(error);
      setResult("Maaf, terjadi kesalahan saat menghubungi asisten AI.");
    } finally {
      setLoading(false);
    }
  };

  const viewConsultation = (item: ConsultationRecord) => {
    setPatientName(item.patientName);
    setPatientInfo(item.patientInfo);
    setPrescription(item.prescription);
    setSubjective(item.subjective);
    setObjective(item.objective);
    setResult(item.result);
    setActiveTab('new');
  };

  const viewScreening = (item: ScreeningRecord) => {
    setScreeningInput(item.prescriptionText);
    setScreeningImage(item.image || null);
    setScreeningResult(item.result);
    setActiveTab('screening');
  };

  const clearForm = () => {
    setResult(null);
    setPatientName('');
    setPatientInfo('');
    setPrescription('');
    setSubjective('');
    setObjective('');
  };

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join(' ');
    if (node?.props?.children) return extractText(node.children || node.props.children);
    return '';
  };

  const MarkdownComponents = {
    blockquote: ({ children }: any) => {
      const content = extractText(children);

      let icon = <Info size={20} />;
      let borderColor = 'var(--secondary)';
      let bgColor = '#f1f5f9';

      if (content.includes('[KRITIS]')) {
        icon = <AlertCircle size={20} color="#ef4444" />;
        borderColor = 'var(--danger)';
        bgColor = '#fef2f2';
      } else if (content.includes('[PERINGATAN]')) {
        icon = <AlertTriangle size={20} color="#f59e0b" />;
        borderColor = 'var(--warning)';
        bgColor = '#fffbeb';
      } else if (content.includes('[SARAN]')) {
        icon = <CheckCircle2 size={20} color="#10b981" />;
        borderColor = 'var(--primary)';
        bgColor = '#f0fdfa';
      }

      return (
        <blockquote style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
          borderLeftWidth: '6px',
          borderLeftStyle: 'solid',
          padding: '1.25rem 1.5rem',
          margin: '1.5rem 0',
          borderRadius: '8px',
          color: 'inherit'
        }}>
          <div style={{ marginTop: '0.2rem' }}>{icon}</div>
          <div style={{ flex: 1 }}>{children}</div>
        </blockquote>
      );
    }
  };

  const cleanMarkdown = (text: string | null) => {
    if (!text) return "";
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```+(markdown|text)?\s*/i, '').replace(/\s*```+$/i, '');
    cleaned = cleaned.replace(/^`+/, '').replace(/`+$/, '');
    return cleaned.trim();
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <ClipboardCheck size={28} />
          <span>Apoteker AI</span>
        </div>

        <nav className="nav-links">
          <a
            className={`nav-item ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <Plus size={20} />
            Asuhan Kefarmasian
          </a>
          <a
            className={`nav-item ${activeTab === 'screening' ? 'active' : ''}`}
            onClick={() => setActiveTab('screening')}
          >
            <FileSearch size={20} />
            Skrining Resep
          </a>
          <a
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} />
            Riwayat SOAP
          </a>
          <a
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            Pengaturan
          </a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <a className="nav-item">
            <LogOut size={20} />
            Keluar
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header>
          <div>
            <h1>
              {activeTab === 'new' ? 'Konsultasi Klinis & SOAP' :
                activeTab === 'screening' ? 'Skrining Resep Rawat Jalan' :
                  activeTab === 'history' ? 'Riwayat Pemeriksaan' : 'Pengaturan'}
            </h1>
            <p className="text-light">
              {activeTab === 'new' ? 'Satu alur untuk skrining keamanan resep dan dokumentasi SOAP.' :
                activeTab === 'screening' ? 'Analisis resep cepat berbasis PCNE v9.00 (Teks/Foto/Suara).' :
                  activeTab === 'history' ? 'Lihat kembali draf SOAP dan skrining yang pernah dibuat.' :
                    'Kelola preferensi aplikasi Anda.'}
            </p>
          </div>
          {activeTab === 'new' && (
            <div style={{ display: 'none' }}>
              {/* Buttons moved to result area */}
            </div>
          )}
        </header>

        <div className="content-inner">
          {activeTab === 'new' && (
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
                      <textarea
                        rows={2}
                        placeholder="Umur, BB, Riwayat Penyakit/Alergi..."
                        value={patientInfo}
                        onChange={(e) => setPatientInfo(e.target.value)}
                        required
                      />
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
                <div className="result-area">
                  <div className="result-header">
                    <h3>Hasil Analisis & Draf SOAP</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" onClick={() => setResult(null)}>
                        Reset
                      </button>
                      <button className="btn-primary" onClick={() => window.print()}>
                        <Printer size={18} />
                        Cetak Laporan
                      </button>
                    </div>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {cleanMarkdown(result)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'screening' && (
            <div style={{ display: 'grid', gridTemplateColumns: screeningResult ? '1fr' : '1fr', maxWidth: '900px', margin: '0 auto' }}>
              {!screeningResult ? (
                <div className="card">
                  <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Alur Skrining Resep</h2>

                  <div className="upload-grid">
                    <label className="upload-card">
                      <Camera size={32} />
                      <span>Foto Resep</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setScreeningImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <label className="upload-card">
                      <Mic size={32} />
                      <span>Rekam Suara</span>
                      <p style={{ fontSize: '0.75rem' }}>Upload file audio</p>
                      <input type="file" accept="audio/*" />
                    </label>
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
                    onClick={async () => {
                      setIsScreening(true);
                      try {
                        const res = await analyzePrescription(
                          screeningInput,
                          screeningImage ? [screeningImage] : [],
                          '',
                          { apiKey, baseUrl }
                        );
                        const resultText = res || "Gagal melakukan skrining.";
                        setScreeningResult(resultText);

                        const newRecord: ScreeningRecord = {
                          id: Date.now().toString(),
                          date: new Date().toLocaleString('id-ID'),
                          prescriptionText: screeningInput,
                          image: screeningImage || undefined,
                          result: resultText
                        };
                        addScreening(newRecord);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsScreening(false);
                      }
                    }}
                  >
                    {isScreening ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                    Mulai Skrining Otomatis
                  </button>
                </div>
              ) : (
                <div className="result-area">
                  <div className="result-header">
                    <h3>Hasil Skrining (PCNE v9.00)</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" onClick={() => setScreeningResult(null)}>
                        Reset
                      </button>
                      <button className="btn-primary" onClick={() => window.print()}>
                        <Printer size={18} />
                        Cetak Laporan
                      </button>
                    </div>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {cleanMarkdown(screeningResult)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem'
              }}>
                <button
                  className={`btn-subtab ${historySubTab === 'consultation' ? 'active' : ''}`}
                  onClick={() => setHistorySubTab('consultation')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: historySubTab === 'consultation' ? 'var(--primary)' : 'transparent',
                    color: historySubTab === 'consultation' ? 'white' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Riwayat Konsultasi (SOAP)
                </button>
                <button
                  className={`btn-subtab ${historySubTab === 'screening' ? 'active' : ''}`}
                  onClick={() => setHistorySubTab('screening')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: historySubTab === 'screening' ? 'var(--primary)' : 'transparent',
                    color: historySubTab === 'screening' ? 'white' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Riwayat Skrining
                </button>
              </div>

              {historySubTab === 'consultation' ? (
                <div className="history-list">
                  {consultationHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <History size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>Belum ada riwayat konsultasi.</p>
                    </div>
                  ) : (
                    consultationHistory.map(item => (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{item.patientName || 'Tanpa Nama'}</h4>
                          <p className="text-light" style={{ fontSize: '0.85rem' }}>{item.date}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-outline" onClick={() => viewConsultation(item)}>
                            <ChevronRight size={18} />
                            Buka
                          </button>
                          <button
                            className="btn-outline"
                            style={{ color: 'var(--danger)', borderColor: '#fee2e2' }}
                            onClick={() => deleteConsultation(item.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="history-list">
                  {screeningHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <FileSearch size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>Belum ada riwayat skrining.</p>
                    </div>
                  ) : (
                    screeningHistory.map(item => (
                      <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>
                            {item.prescriptionText ?
                              (item.prescriptionText.length > 40 ? item.prescriptionText.substring(0, 40) + '...' : item.prescriptionText)
                              : 'Input Gambar/Suara'}
                          </h4>
                          <p className="text-light" style={{ fontSize: '0.85rem' }}>{item.date}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-outline" onClick={() => viewScreening(item)}>
                            <ChevronRight size={18} />
                            Buka
                          </button>
                          <button
                            className="btn-outline"
                            style={{ color: 'var(--danger)', borderColor: '#fee2e2' }}
                            onClick={() => deleteScreening(item.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Konfigurasi API AI</h2>
                <div className="form-group">
                  <label>API Key (Sumopod)</label>
                  <input
                    type="password"
                    placeholder="Masukkan API Key Anda..."
                    value={apiKey}
                    onChange={(e) => setConfig({ apiKey: e.target.value })}
                  />
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Kosongkan jika ingin menggunakan kunci default dari environment.
                  </p>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Base URL</label>
                  <input
                    type="text"
                    placeholder="Contoh: https://api.sumopod.com/v1"
                    value={baseUrl}
                    onChange={(e) => setConfig({ baseUrl: e.target.value })}
                  />
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Endpoint API untuk layanan AI (Sumopod/OpenAI compatible).
                  </p>
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ marginBottom: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Konfigurasi Aktif Saat Ini:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Base URL:</span>
                      <code style={{ backgroundColor: '#e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{baseUrl || defaultBaseURL || 'Belum diatur'}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>API Key:</span>
                      <code style={{ backgroundColor: '#e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {apiKey ? (apiKey.length > 8 ? apiKey.slice(0, 4) + '...' + apiKey.slice(-4) : 'Kustom') : (defaultApiKey ? 'Default (Env)' : 'Tidak Terdeteksi')}
                      </code>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Note:</strong> Pengaturan ini disimpan secara lokal di browser Anda. Kunci kustom akan diprioritaskan di atas nilai default dari file environment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .history-list { max-width: 800px; margin: 0 auto; }
      `}</style>
    </div>
  );
}

export default App;
