import React, { useState, useEffect } from 'react';
import { Navigate, Routes, Route, BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './pages/AuthPage';
import { supabase } from './services/supabase';
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
  X,
  Menu,
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeConsultation, analyzePrescription } from './services/aiService';
import { usePharmacyStore } from './store/usePharmacyStore';
import type { ConsultationRecord, ScreeningRecord } from './store/usePharmacyStore';

declare global {
  interface Window {
    snap: any;
  }
}

type Tab = 'new' | 'screening' | 'history' | 'settings';

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientInfo, setPatientInfo] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');

  // Screening States
  const [screeningInput, setScreeningInput] = useState('');
  const [screeningImage, setScreeningImage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<string | null>(null);
  const [isScreening, setIsScreening] = useState(false);

  // Sync activeTab with URL path
  const [activeTab, setActiveTab] = useState<Tab>('new');

  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path === 'asuhan' || path === '') setActiveTab('new');
    else if (path === 'skrining') setActiveTab('screening');
    else if (path === 'riwayat') setActiveTab('history');
    else if (path === 'pengaturan') setActiveTab('settings');
    else if (path === '') navigate('/asuhan', { replace: true });
  }, [location.pathname, navigate]);

  const goToTab = (tab: Tab) => {
    setIsMobileMenuOpen(false);
    if (tab === 'new') navigate('/asuhan');
    else if (tab === 'screening') navigate('/skrining');
    else if (tab === 'history') navigate('/riwayat');
    else if (tab === 'settings') navigate('/pengaturan');
  };

  // Limit logic
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
    setConfig,
    tier,
    usageCountThisMonth,
    user
  } = usePharmacyStore();

  const [historySubTab, setHistorySubTab] = useState<'consultation' | 'screening'>('consultation');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flagFilter, setFlagFilter] = useState<'all' | 'kritis' | 'peringatan' | 'saran'>('all');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editSipa, setEditSipa] = useState('');
  const [editPuskesmas, setEditPuskesmas] = useState('');

  // Voice States
  const [isListening, setIsListening] = useState(false);

  // Settings Sub-Tab
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'subscription'>('profile');

  const checkLimit = () => {
    if (tier === 'free' && usageCountThisMonth >= 15) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // Filter Logic
  const filteredConsultations = consultationHistory.filter(item => {
    const matchesSearch = (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple date string parsing for comparison (format: dd/mm/yyyy, hh.mm.ss)
    // For production, we should store ISO dates
    const itemDate = new Date(item.date.split(',')[0].split('/').reverse().join('-'));
    const isWithinDate = (!startDate || itemDate >= new Date(startDate)) &&
                         (!endDate || itemDate <= new Date(endDate));
    
    // Tier check (Free user only sees last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isTierAllowed = tier === 'pro' || itemDate >= thirtyDaysAgo;

    // Flag check
    const matchesFlag = flagFilter === 'all' || 
                       (flagFilter === 'kritis' && item.result.includes('[KRITIS]')) ||
                       (flagFilter === 'peringatan' && item.result.includes('[PERINGATAN]')) ||
                       (flagFilter === 'saran' && item.result.includes('[SARAN]'));

    return matchesSearch && isWithinDate && isTierAllowed && matchesFlag;
  });

  const filteredScreenings = screeningHistory.filter(item => {
    const matchesSearch = (item.prescriptionText || '').toLowerCase().includes(searchQuery.toLowerCase());
    const itemDate = new Date(item.date.split(',')[0].split('/').reverse().join('-'));
    const isWithinDate = (!startDate || itemDate >= new Date(startDate)) &&
                         (!endDate || itemDate <= new Date(endDate));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isTierAllowed = tier === 'pro' || itemDate >= thirtyDaysAgo;

    const matchesFlag = flagFilter === 'all' || 
                       (flagFilter === 'kritis' && item.result.includes('[KRITIS]')) ||
                       (flagFilter === 'peringatan' && item.result.includes('[PERINGATAN]')) ||
                       (flagFilter === 'saran' && item.result.includes('[SARAN]'));

    return matchesSearch && isWithinDate && isTierAllowed && matchesFlag;
  });

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
    } catch (err: any) {
      alert("Gagal memperbarui profil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditFullName(user?.user_metadata?.full_name || '');
    setEditSipa(user?.user_metadata?.sipa || '');
    setEditPuskesmas(user?.user_metadata?.puskesmas || '');
    setIsEditingProfile(true);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur Rekam Suara. Gunakan Chrome/Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setScreeningInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Payment Function Error:", errorData);
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);
      
      if (window.snap && resData.token) {
        window.snap.pay(resData.token, {
          onSuccess: function(){
            alert("Pembayaran berhasil! Mengupdate status langganan...");
            usePharmacyStore.getState().loadUserData(); // Optimistic update
            setShowUpgradeModal(false);
          },
          onPending: function(){
            alert("Menunggu pembayaran Anda diselesaikan!");
            setShowUpgradeModal(false);
          },
          onError: function(){
            alert("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: function(){
            console.log('User closed popup');
            setLoading(false);
          }
        });
      } else {
        alert("Sistem Midtrans Snap gagal dimuat. Cek Console.");
      }
    } catch (err: any) {
      alert("Gagal memproses pembayaran: " + err.message);
    } finally {
      if (!window.snap) setLoading(false); 
      // If snap opened, loading will clear when component unmounts or closes
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1024;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handlers
  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting Care Plan analysis...");
    if (!checkLimit()) {
      console.log("Limit reached");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      console.log("Calling analyzeConsultation with:", { prescription, patientInfo, diagnosis });
      const data = await analyzeConsultation(
        prescription,
        patientInfo,
        subjective,
        objective,
        diagnosis,
        { apiKey, baseUrl },
        (chunk) => setResult(chunk)
      );
      if (data) {
        setResult(data + "\n\n---\n*--- akhir analisis ---*");
        console.log("Analysis received successfully");
        const newRecord: ConsultationRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('id-ID'),
          patientName,
          patientInfo,
          diagnosis,
          prescription,
          subjective,
          objective,
          result: data
        };
        addConsultation(newRecord);
      } else {
        throw new Error("AI tidak memberikan respon.");
      }
    } catch (error: any) {
      console.error("Care Plan Error:", error);
      alert("Error: " + (error.message || "Gagal menghubungi AI"));
      setResult("Maaf, terjadi kesalahan: " + (error.message || "Koneksi terputus"));
    } finally {
      setLoading(false);
    }
  };

  const viewConsultation = (item: ConsultationRecord) => {
    setPatientName(item.patientName);
    setPatientInfo(item.patientInfo);
    setDiagnosis(item.diagnosis);
    setPrescription(item.prescription);
    setSubjective(item.subjective);
    setObjective(item.objective);
    setResult(item.result);
    navigate('/asuhan');
  };

  const viewScreening = (item: ScreeningRecord) => {
    setScreeningInput(item.prescriptionText);
    setScreeningImage(item.image || null);
    setScreeningResult(item.result);
    navigate('/skrining');
  };

  const clearForm = () => {
    setResult(null);
    setPatientName('');
    setPatientInfo('');
    setDiagnosis('');
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
      {/* Mobile Header Menu */}
      <div className="mobile-header">
        <div className="logo">
          <ClipboardCheck size={28} />
          <span>Apoteker AI</span>
        </div>
        <button className="btn-outline" style={{ padding: '0.4rem', border: 'none' }} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
            <ClipboardCheck size={28} />
            <span>Apoteker AI</span>
          </div>
          <button className="mobile-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} color="var(--text-light)" />
          </button>
        </div>

        <nav className="nav-links">
          <a
            className={`nav-item ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => goToTab('new')}
            style={{ cursor: 'pointer' }}
          >
            <Plus size={20} />
            Asuhan Kefarmasian
          </a>
          <a
            className={`nav-item ${activeTab === 'screening' ? 'active' : ''}`}
            onClick={() => goToTab('screening')}
            style={{ cursor: 'pointer' }}
          >
            <FileSearch size={20} />
            Skrining Resep
          </a>
          <a
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => goToTab('history')}
            style={{ cursor: 'pointer' }}
          >
            <History size={20} />
            Riwayat SOAP
          </a>
          <a
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => goToTab('settings')}
            style={{ cursor: 'pointer' }}
          >
            <Settings size={20} />
            Pengaturan
          </a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <a className="nav-item" onClick={() => supabase.auth.signOut()} style={{ cursor: 'pointer' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <textarea
                          rows={2}
                          placeholder="Umur, BB, Riwayat Penyakit/Alergi..."
                          value={patientInfo}
                          onChange={(e) => setPatientInfo(e.target.value)}
                          required
                        />
                        <textarea
                          rows={2}
                          placeholder="Diagnosis Utama (Wajib)..."
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          required
                        />
                      </div>
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
                <div className="result-area" id="printable-result">
                  <div className="result-header no-print">
                    <h3>Hasil Analisis & Draf SOAP</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" onClick={() => setResult(null)}>
                        Reset
                      </button>
                      <button className="btn-outline" onClick={() => {
                        navigator.clipboard.writeText(result);
                        alert("Hasil berhasil disalin ke clipboard!");
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
                              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Dokumen Asuhan Kefarmasian (Care Plan)</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                              <p style={{ margin: 0, fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                              <p style={{ margin: 0, fontSize: '0.8rem' }}>Tgl: {new Date().toLocaleDateString('id-ID')}</p>
                          </div>
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

                  {/* Print Footer */}
                  <div className="print-footer" style={{ display: 'none', marginTop: '3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ textAlign: 'center', width: '200px' }}>
                              <p>Apoteker Penanggung Jawab,</p>
                              <div style={{ height: '60px' }}></div>
                              <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{user?.user_metadata?.full_name || 'Apoteker'}</p>
                              <p style={{ fontSize: '0.8rem' }}>SIPA: {user?.user_metadata?.sipa || '-'}</p>
                          </div>
                      </div>
                      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                          Laporan ini dihasilkan secara otomatis oleh FarmasiKu AI.
                      </div>
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const resized = await resizeImage(file);
                            setScreeningImage(resized);
                          }
                        }}
                      />
                    </label>
                     <button 
                      type="button" 
                      className={`upload-card ${isListening ? 'listening' : ''}`}
                      onClick={toggleSpeechRecognition}
                      style={{ background: 'none', cursor: 'pointer', border: 'none', padding: 0 }}
                    >
                      <Mic size={32} color={isListening ? 'var(--danger)' : 'currentColor'} />
                      <span>{isListening ? 'Mendengarkan...' : 'Input Suara'}</span>
                      <p style={{ fontSize: '0.75rem' }}>Klik & Bicara</p>
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
                    onClick={async () => {
                      console.log("Starting Screening analysis...");
                      if (!checkLimit()) return;
                      setIsScreening(true);
                      try {
                        const res = await analyzePrescription(
                          screeningInput,
                          screeningImage ? [screeningImage] : [],
                          '',
                          { apiKey, baseUrl },
                          (chunk) => setScreeningResult(chunk)
                        );
                        if (!res) throw new Error("AI tidak memberikan respon skrining.");
                        setScreeningResult(res + "\n\n---\n*--- akhir analisis ---*");
                        
                        const resultText = res;

                        const newRecord: ScreeningRecord = {
                          id: Date.now().toString(),
                          date: new Date().toLocaleString('id-ID'),
                          prescriptionText: screeningInput,
                          image: screeningImage || undefined,
                          result: resultText
                        };
                        addScreening(newRecord);
                      } catch (err: any) {
                        console.error("Screening Error:", err);
                        alert("Skrining Gagal: " + (err.message || "Gagal menghubungi AI"));
                        setScreeningResult("Gagal melakukan skrining: " + (err.message || "Koneksi terputus"));
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
                <div className="result-area" id="printable-screening">
                  <div className="result-header no-print">
                    <h3>Hasil Skrining (PCNE v9.00)</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" onClick={() => setScreeningResult(null)}>
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

                  <div className="markdown-content">
                    <ReactMarkdown
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {cleanMarkdown(screeningResult)}
                    </ReactMarkdown>
                  </div>

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
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <FileSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input
                    type="text"
                    placeholder="Cari Nama Pasien / Diagnosa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem', width: '130px', marginBottom: 0 }}
                  />
                  <span className="text-light">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem', width: '130px', marginBottom: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <select 
                    value={flagFilter} 
                    onChange={(e: any) => setFlagFilter(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem', borderRadius: '4px', marginBottom: 0 }}
                   >
                     <option value="all">Semua Status</option>
                     <option value="kritis">🚨 Kritis Only</option>
                     <option value="peringatan">⚠️ Perhatian Only</option>
                     <option value="saran">✅ Aman Only</option>
                   </select>
                </div>
                {(searchQuery || startDate || endDate || flagFilter !== 'all') && (
                   <button 
                    className="text-light" 
                    style={{ fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setFlagFilter('all'); }}
                   >
                     Reset Filter
                   </button>
                )}
              </div>

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
                  Riwayat Konsultasi (SOAP) {tier === 'free' && <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '0.4rem' }}>(30 Hari)</span>}
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
                  Riwayat Skrining {tier === 'free' && <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '0.4rem' }}>(30 Hari)</span>}
                </button>
              </div>

              {historySubTab === 'consultation' ? (
                <div className="history-list">
                  {filteredConsultations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <History size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>{searchQuery || startDate || endDate ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada riwayat konsultasi.'}</p>
                    </div>
                  ) : (
                    filteredConsultations.map(item => (
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
                  {filteredScreenings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <FileSearch size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                      <p>{searchQuery || startDate || endDate ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada riwayat skrining.'}</p>
                    </div>
                  ) : (
                    filteredScreenings.map(item => (
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
                  <>
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
                  </>
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

                    <div style={{ display: 'grid', gap: '1rem' }}>
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
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }} onClick={() => setShowUpgradeModal(true)}>
                                Upgrade Sekarang (Rp 79.000 / Bulan)
                            </button>
                        </div>
                    )}
                  </div>
                )}

                <div className="settings-section" style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Status Layanan</h4>
                    <div style={{ 
                        padding: '1.25rem', 
                        borderRadius: '12px', 
                        backgroundColor: tier === 'pro' ? '#f0fdf4' : '#f8fafc',
                        border: `1px solid ${tier === 'pro' ? '#bbf7d0' : '#e2e8f0'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ 
                                    padding: '0.2rem 0.6rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 'bold',
                                    backgroundColor: tier === 'pro' ? 'var(--primary)' : '#64748b',
                                    color: 'white'
                                }}>
                                    {tier === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
                                </span>
                                {tier === 'free' && (
                                    <span className="text-light" style={{ fontSize: '0.8rem' }}>
                                        {usageCountThisMonth}/15 Dokumen
                                    </span>
                                )}
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                {tier === 'pro' ? 'Anda memiliki akses tanpa batas ke seluruh fitur.' : 'Tingkatkan akun untuk akses tanpa batas.'}
                            </p>
                        </div>
                        {tier === 'free' && (
                            <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowUpgradeModal(true)}>
                                Upgrade
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn-outline" style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: '#fee2e2' }} onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    }}>
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
                                // Simple toggle back if they really need API keys, but hidden by default
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
          )}
        </div>
      </main>

      {showUpgradeModal && (
        <div className="mobile-overlay active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowUpgradeModal(false)}>
            <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button className="mobile-close-btn" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowUpgradeModal(false)}>
                   <X size={20} color="#94a3b8" />
                </button>
                <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
                <h3>Batas Penggunaan Tercapai</h3>
                <p className="text-light" style={{ margin: '1rem 0' }}>Anda telah mencapai batas 15 dokumen skrining & Care Plan untuk penggunaan Gratis bulan ini.</p>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Upgrade ke Pro (Rp 79.000)</h4>
                    <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: '#475569', margin: '0 0 0 1rem', padding: 0 }}>
                        <li>✓ Skrining AI Tanpa Batas (Unlimited)</li>
                        <li>✓ Kemampuan Export PDF Laporan</li>
                        <li>✓ Histori Data Disimpan selama 1 Tahun</li>
                        <li>✓ Dapat Memproses Resep Kompleks via Gambar</li>
                    </ul>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading} onClick={handlePayment}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Upgrade Sekarang (Rp 79.000)'}
                </button>
            </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .history-list { max-width: 800px; margin: 0 auto; }
        
        .upload-card.listening {
          border-color: var(--danger);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @media print {
          body { background: white !important; color: black !important; }
          .no-print, .sidebar, .btn-primary, .btn-outline, .btn-subtab, .top-nav, .mobile-menu-btn { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .app-container { display: block !important; padding: 0 !important; }
          .content-inner { padding: 0 !important; border: none !important; box-shadow: none !important; background: transparent !important; }
          .card { border: none !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; }
          .print-header { display: block !important; }
          .print-footer { display: block !important; }
          .markdown-content h4 { color: black !important; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
          .markdown-content p { font-size: 11pt !important; line-height: 1.5; }
          .markdown-content blockquote { border-left: 3px solid #000 !important; background: #f9f9f9 !important; color: #000 !important; }
          .result-card { width: 100% !important; max-width: 100% !important; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}

export function AppWrapper() {
  const { setUser, setTier } = usePharmacyStore();
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.tier) setTier(session.user.user_metadata.tier);
      if (session?.user) usePharmacyStore.getState().loadUserData();
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.tier) setTier(session.user.user_metadata.tier);
      if (session?.user) usePharmacyStore.getState().loadUserData();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } />
        <Route path="/asuhan-kefarmasian" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = usePharmacyStore();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

export default AppWrapper;
