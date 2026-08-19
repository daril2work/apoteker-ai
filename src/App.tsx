import React, { useState, useEffect } from 'react';
import { Navigate, Routes, Route, BrowserRouter, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './pages/AuthPage';
import { supabase } from './services/supabase';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { usePharmacyStore } from './store/usePharmacyStore';

// Extracted Modular Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import UpgradeModal from './components/UpgradeModal';

// Extracted Modular Pages
import PatientsPage from './pages/dashboard/PatientsPage';
import PatientProfilePage from './pages/dashboard/PatientProfilePage';
import MTMSessionPage from './pages/dashboard/MTMSessionPage';
import PengaturanPage from './pages/dashboard/PengaturanPage';
import MigrationPage from './pages/dashboard/MigrationPage';
import SkriningPage from './pages/dashboard/SkriningPage';
import AdminLayout from './pages/admin/AdminLayout';
import AIAssistantWidget from './components/AIAssistantWidget';

declare global {
  interface Window {
    snap: any;
  }
}

function MainApp() {
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic Header title & description depending on route
  const [headerTitle, setHeaderTitle] = useState('Konsultasi Klinis & SOAP');
  const [headerDesc, setHeaderDesc] = useState('Satu alur untuk skrining keamanan resep dan dokumentasi SOAP.');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/mtm/sesi')) {
      setHeaderTitle('Sesi MTM');
      setHeaderDesc('MTR, Rekonsiliasi Obat, dan Generate MAP/CPPT.');
    } else if (path.includes('/mtm/pasien')) {
      setHeaderTitle('Profil PMR Pasien');
      setHeaderDesc('Riwayat pengobatan dan sesi MTM pasien.');
    } else if (path.includes('/mtm')) {
      setHeaderTitle('Daftar Pasien');
      setHeaderDesc('Kelola pasien dan mulai Medication Therapy Management.');
    } else if (path.includes('/skrining')) {
      setHeaderTitle('Skrining Resep');
      setHeaderDesc('Tangkap layar RME atau foto resep untuk analisis AI otomatis.');
    } else if (path.includes('/pengaturan')) {
      setHeaderTitle('Pengaturan');
      setHeaderDesc('Kelola preferensi aplikasi Anda.');
    }
  }, [location.pathname]);

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
          onSuccess: function() {
            alert("Pembayaran berhasil! Mengupdate status langganan...");
            usePharmacyStore.getState().loadUserData(); // Optimistic update
            setShowUpgradeModal(false);
          },
          onPending: function() {
            alert("Menunggu pembayaran Anda diselesaikan!");
            setShowUpgradeModal(false);
          },
          onError: function() {
            alert("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: function() {
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
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (Just for Logo/Branding on mobile) */}
      <div className="mobile-header">
        <div className="logo">
          <ClipboardCheck size={28} />
          <span>Farmasiku</span>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-content">
        <header>
          <div>
            <h1>{headerTitle}</h1>
            <p className="text-light">{headerDesc}</p>
          </div>
        </header>

        <div className="content-inner">
          <Routes>
            <Route path="/" element={<Navigate to="mtm" replace />} />
            <Route path="mtm" element={<PatientsPage />} />
            <Route path="mtm/pasien/:id" element={<PatientProfilePage />} />
            <Route path="mtm/sesi/:id" element={<MTMSessionPage onShowUpgradeModal={() => setShowUpgradeModal(true)} />} />
            <Route path="skrining" element={<SkriningPage onShowUpgradeModal={() => setShowUpgradeModal(true)} />} />
            <Route path="pengaturan" element={<PengaturanPage onShowUpgradeModal={() => setShowUpgradeModal(true)} />} />
            <Route path="migrasi" element={<MigrationPage />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Upgrade Checkout Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        loading={loading} 
        onUpgrade={handlePayment} 
      />
    </div>
  );
}

export function AppWrapper() {
  const { user, setUser, setTier } = usePharmacyStore();
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const checkTier = async (session: any) => {
      try {
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('status, expired_at')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .gt('expired_at', new Date().toISOString())
          .maybeSingle();

        if (error) {
          console.error("Failed to check tier from database", error);
        } else {
          setTier(subscription ? 'pro' : 'free');
        }
      } catch (err) {
        console.error("Failed to check tier", err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) {
        checkTier(session).finally(() => setSessionLoading(false));
      } else {
        setSessionLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        checkTier(session);
        usePharmacyStore.getState().loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* Show AI Assistant Widget globally when user is logged in */}
      {user && <AIAssistantWidget />}
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
