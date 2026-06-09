import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
  ClipboardCheck,
  Plus,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  return (
    <>
      {/* Sidebar Layout (Desktop Only) */}
      <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
            <ClipboardCheck size={28} />
            <span>Apoteker AI</span>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/mtm"
            className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith('/mtm') ? 'active' : ''}`}
          >
            <Plus size={20} />
            Pasien & MTM
          </NavLink>
          <NavLink
            to="/pengaturan"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            Pengaturan
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button 
            className="nav-item" 
            onClick={() => supabase.auth.signOut()} 
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
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
