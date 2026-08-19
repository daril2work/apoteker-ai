import React from 'react';
import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { LayoutDashboard, Database, ArrowLeft } from 'lucide-react';
import AdminDashboardPage from './AdminDashboardPage';
import AdminRAGPage from './AdminRAGPage';

export default function AdminLayout() {
  const { role } = usePharmacyStore();
  const location = useLocation();

  if (role !== 'admin') {
    return <Navigate to="/mtm" replace />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Admin Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)' }}>
          Farmasiku Admin
        </div>
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link 
            to="/admin/dashboard" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', 
              borderRadius: '8px', textDecoration: 'none', 
              backgroundColor: location.pathname.includes('/dashboard') ? 'var(--primary)' : 'transparent',
              color: location.pathname.includes('/dashboard') ? 'white' : 'var(--text-color)'
            }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/admin/rag" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', 
              borderRadius: '8px', textDecoration: 'none', 
              backgroundColor: location.pathname.includes('/rag') ? 'var(--primary)' : 'transparent',
              color: location.pathname.includes('/rag') ? 'white' : 'var(--text-color)'
            }}
          >
            <Database size={20} />
            RAG Management
          </Link>
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-light)' }}>
            <ArrowLeft size={20} />
            Kembali ke Aplikasi
          </Link>
        </div>
      </div>

      {/* Admin Main Content */}
      <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="rag" element={<AdminRAGPage />} />
        </Routes>
      </div>
    </div>
  );
}
