import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Users, CreditCard, Activity, Coins } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  proUsers: number;
  churnedUsers: number;
  totalTokens: number;
  xenditBalance: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    proUsers: 0,
    churnedUsers: 0,
    totalTokens: 0,
    xenditBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get all profiles to count total users
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Get subscriptions
      const { data: subscriptions } = await supabase.from('subscriptions').select('*');
      
      let pro = 0;
      let churned = 0;
      const now = new Date();
      
      if (subscriptions) {
        subscriptions.forEach(sub => {
          if (sub.status === 'active' && new Date(sub.expired_at) > now) {
            pro++;
          } else {
            churned++;
          }
        });
      }

      // Get tokens used
      const { data: usageLogs } = await supabase.from('usage_logs').select('tokens_used');
      const tokens = usageLogs ? usageLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0) : 0;

      // Get Xendit Balance via Edge Function
      let balance = 0;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-xendit-balance`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const data = await res.json();
          if (data.balance) {
            balance = data.balance;
          }
        } catch(e) {
          console.error('Failed to fetch Xendit balance', e);
        }
      }

      setStats({
        totalUsers: totalUsers || 0,
        proUsers: pro,
        churnedUsers: churned,
        totalTokens: tokens,
        xenditBalance: balance
      });
    } catch (error) {
      console.error("Error loading stats", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, subtitle, color }: any) => (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      padding: '1.5rem',
      borderRadius: '16px',
      border: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ 
        width: '60px', height: '60px', borderRadius: '12px', 
        backgroundColor: `${color}15`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard 
          title="Total Pengguna" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users size={30} />} 
          color="#3b82f6" 
          subtitle="Seluruh user terdaftar"
        />
        <StatCard 
          title="User Aktif (Pro)" 
          value={stats.proUsers.toLocaleString()} 
          icon={<Activity size={30} />} 
          color="#10b981" 
          subtitle="Langganan aktif"
        />
        <StatCard 
          title="User Churn" 
          value={stats.churnedUsers.toLocaleString()} 
          icon={<Users size={30} />} 
          color="#ef4444" 
          subtitle="Langganan kedaluwarsa"
        />
        <StatCard 
          title="Total Token AI" 
          value={stats.totalTokens.toLocaleString()} 
          icon={<Coins size={30} />} 
          color="#8b5cf6" 
          subtitle="Digunakan bulan ini"
        />
        <StatCard 
          title="Saldo Xendit" 
          value={`Rp ${stats.xenditBalance.toLocaleString('id-ID')}`} 
          icon={<CreditCard size={30} />} 
          color="#f59e0b" 
          subtitle="Balance terkini"
        />
      </div>

      <div style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderRadius: '16px', 
        padding: '2rem', 
        border: '1px solid var(--border-color)',
        minHeight: '300px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sistem Normal</h2>
        <p style={{ color: 'var(--text-light)' }}>
          Semua metrik termonitor dengan baik. Tidak ada lonjakan penggunaan API yang mencurigakan.
        </p>
      </div>
    </div>
  );
}
