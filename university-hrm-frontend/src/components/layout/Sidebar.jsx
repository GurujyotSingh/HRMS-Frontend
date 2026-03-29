import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Clock,
  Wallet,
  UserPlus,
  TrendingUp,
  MessageSquare,
  ScrollText,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Btn } from '../ui';

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 'var(--radius-sm)',
  color: isActive ? 'var(--white)' : 'rgba(250,246,238,0.75)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  borderLeft: isActive ? '3px solid var(--terracotta)' : '3px solid transparent',
  background: isActive ? 'rgba(196,98,45,0.2)' : 'transparent',
});

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const items = [
  { to: '/dashboard',   icon: '⊞', label: 'Dashboard',    roles: null },
  { to: '/employees',   icon: '👥', label: 'Employees',    roles: ['admin', 'hr'] },
  { to: '/departments', icon: '🏛', label: 'Departments',  roles: ['admin', 'hr'] },
  { to: '/leaves',      icon: '🌿', label: 'Leave',        roles: null },
  { to: '/attendance',  icon: '📋', label: 'Attendance',   roles: null },
  { to: '/payroll',     icon: '💰', label: 'Payroll',      roles: ['admin', 'hr', 'accountant'] },
  { to: '/onboarding',  icon: '🚪', label: 'Onboarding',   roles: ['admin', 'hr', 'employee'] },
  { to: '/performance', icon: '📈', label: 'Performance',  roles: null },
  { to: '/chat',        icon: '💬', label: 'AI Assistant', roles: null },
  { to: '/audit',       icon: '🔍', label: 'Audit Logs',   roles: ['admin'] },
].filter((i) => !i.roles || hasRole(...i.roles));  

  const w = collapsed ? 72 : 256;

  return (
    <aside
      style={{
        width: w,
        minWidth: w,
        background: 'var(--soil)',
        color: 'var(--linen)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        borderRight: '1px solid var(--bark)',
      }}
    >
      <div style={{ padding: collapsed ? '16px 12px' : '20px 18px', borderBottom: '1px solid var(--bark)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: collapsed ? 24 : 28 }}>🎓</span>
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
              UniHRM
            </span>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={linkStyle} title={collapsed ? label : undefined}>
            <Icon size={20} strokeWidth={1.75} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--bark)' }}>
        {!collapsed && (
          <div style={{ marginBottom: 12, padding: '0 8px' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {user?.first_name
                ? `${user.first_name} ${user.last_name || ''}`.trim()
                : user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, textTransform: 'capitalize' }}>
              {user?.role?.name?.replace(/_/g, ' ')}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            style={{
              color: 'var(--linen)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
            }}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span style={{ marginLeft: 8 }}>Collapse</span>}
          </Btn>
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'var(--bark)',
              color: 'var(--linen)',
              borderColor: 'var(--bark)',
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span style={{ marginLeft: 8 }}>Logout</span>}
          </Btn>
        </div>
      </div>
    </aside>
  );
}
