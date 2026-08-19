import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Plus, Settings, LogOut, ScanSearch } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavLink
          to="/pengaturan"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={24} />
          <span>Pengaturan</span>
        </NavLink>

        <NavLink
          to="/mtm"
          className={({ isActive }) => 
            `bottom-nav-item center-action ${isActive || location.pathname.startsWith('/mtm') ? 'active' : ''}`
          }
        >
          <div className="center-action-btn">
            <Plus size={28} color="white" />
          </div>
          <span>MTM</span>
        </NavLink>

        <NavLink
          to="/skrining"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <ScanSearch size={24} />
          <span>Skrining</span>
        </NavLink>

        <button 
          className="bottom-nav-item" 
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={24} />
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
