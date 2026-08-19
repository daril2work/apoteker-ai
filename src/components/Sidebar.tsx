import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
  ClipboardCheck,
  Plus,
  Settings,
  LogOut,
  ScanSearch,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { usePharmacyStore } from '../store/usePharmacyStore';

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { role } = usePharmacyStore();

  return (
    <>
      {/* Sidebar Layout (Desktop Only) */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo" style={{ display: 'flex', width: '100%', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center', marginBottom: isCollapsed ? '2rem' : '0' }}>
          <div style={{ display: isCollapsed ? 'none' : 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
            <ClipboardCheck size={28} />
            <span style={{ whiteSpace: 'nowrap' }}>Farmasiku</span>
          </div>
          <button 
            className="collapse-sidebar-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/mtm"
            className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith('/mtm') ? 'active' : ''}`}
            title="Pasien & MTM"
          >
            <Plus size={20} />
            <span>Pasien & MTM</span>
          </NavLink>
          <NavLink
            to="/skrining"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title="Skrining Resep"
          >
            <ScanSearch size={20} />
            <span>Skrining Resep</span>
          </NavLink>
          <NavLink
            to="/pengaturan"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title="Pengaturan"
          >
            <Settings size={20} />
            <span>Pengaturan</span>
          </NavLink>
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith('/admin') ? 'active' : ''}`}
              title="Admin Panel"
            >
              <ShieldAlert size={20} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button 
            className="nav-item" 
            onClick={() => supabase.auth.signOut()} 
            title="Keluar"
            style={{ 
              cursor: 'pointer', 
              background: 'none', 
              border: 'none', 
              width: '100%', 
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
