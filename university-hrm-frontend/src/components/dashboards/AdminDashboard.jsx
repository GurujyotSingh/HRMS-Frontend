import React, { useState, useEffect } from 'react';
import { Users, Building2, Wallet, CalendarDays, Clock, UserPlus, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Spinner } from '../../components/ui';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--white)', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow)' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ margin: 0, color: entry.color, fontSize: 13 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.admin()
      .then(({ data: d }) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const recentHires = data?.recentHires || [];
  const departments = data?.departments || [];
  const leaveTrend  = data?.leaveTrend  || [];

  const statCards = [
    { label: 'Total Employees',  value: stats.totalEmployees  ?? '—', icon: <Users size={22} />,      color: 'var(--primary)',  bg: 'var(--blue-50)'  },
    { label: 'Active Today',     value: stats.todayPresent    ?? '—', icon: <Clock size={22} />,      color: 'var(--success)',  bg: 'var(--green-50)' },
    { label: 'On Leave Today',   value: stats.onLeaveToday    ?? '—', icon: <CalendarDays size={22} />, color: 'var(--warning)', bg: 'var(--yellow-50)'},
    { label: 'Pending Leaves',   value: stats.pendingLeaves   ?? '—', icon: <TrendingUp size={22} />, color: '#f97316',         bg: '#fff7ed'         },
    { label: 'Departments',      value: stats.departmentCount ?? '—', icon: <Building2 size={22} />,  color: '#8b5cf6',         bg: '#f5f3ff'         },
    { label: 'Payroll (Month)',  value: stats.totalPayrollThisMonth ? `₹${(stats.totalPayrollThisMonth / 100000).toFixed(1)}L` : '—', icon: <Wallet size={22} />, color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <div className="dashboard" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <h1 className="page-title" style={{ marginBottom: 4 }}>
        Welcome back, {user?.firstName || user?.first_name || user?.email?.split('@')[0] || 'Admin'} 👋
      </h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 28, fontSize: 14 }}>
        Here's what's happening in your university today.
      </p>

      {/* Stat Cards */}
      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        {statCards.map((stat, i) => (
          <div className="stat-card" key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div className="stat-value">{loading ? '—' : stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginTop: 24 }}>

          {/* Department Headcount */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Headcount by Department</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                  <XAxis dataKey="code" tick={{ fill: 'var(--gray-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--gray-100)' }} />
                  <Bar dataKey="headCount" name="Employees" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Leave Trend */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Leave Approvals — Last 6 Months</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leaveTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--gray-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--gray-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Leaves Approved" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Hires */}
          {recentHires.length > 0 && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={16} color="var(--success)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Hires</span>
              </div>
              {recentHires.map((emp) => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{emp.department?.name || '—'}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                    {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
