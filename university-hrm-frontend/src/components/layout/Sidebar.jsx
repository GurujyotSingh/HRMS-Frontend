import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Clock,
  Wallet,
  ClipboardList,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  UserSearch,
  Target,
} from 'lucide-react';

/**
 * NAV_ITEMS — roles use the normalized internal role names:
 *   admin, hr, hr_staff, director, faculty, staff
 *
 * HOD / department_head / head_of_department → DIRECTOR everywhere
 * No role restriction = visible to all authenticated users
 */
const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { section: 'Management' },
  { path: '/employees',   label: 'Employees',   icon: Users,       roles: ['admin', 'hr', 'hr_staff'] },
  { path: '/departments', label: 'Departments', icon: Building2,   roles: ['admin', 'hr', 'hr_staff'] },
  { path: '/recruitment', label: 'Recruitment', icon: UserSearch,  roles: ['admin', 'hr'] },

  { section: 'Operations' },
  { path: '/leaves',      label: 'Leaves',      icon: CalendarDays },
  { path: '/attendance',  label: 'Attendance',  icon: Clock },
  { path: '/payroll',     label: 'Payroll',     icon: Wallet },
  { path: '/onboarding',  label: 'Onboarding',  icon: ClipboardList },
  { path: '/performance', label: 'Performance', icon: Target },

  { section: 'Communication' },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },

  { section: 'Intelligence' },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare },

  { section: 'Admin' },
  { path: '/reports',    label: 'Reports',    icon: BarChart3,  roles: ['admin', 'hr', 'director'] },
  { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin'] },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { hasRole } = useAuth();
  const location = useLocation();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.section) return true;
    if (!item.roles) return true;
    return item.roles.some((r) => hasRole(r));
  });

  // Remove consecutive/trailing section headers (empty sections)
  const visibleItems = filteredItems.filter((item, i, arr) => {
    if (!item.section) return true;
    const next = arr[i + 1];
    return next && !next.section;
  });

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'open' : ''}`}
      style={{
        width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--sidebar-border)',
          minHeight: 64,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(27, 110, 243, 0.3)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              UniHRM
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--sidebar-text)', fontWeight: 400, letterSpacing: '0.02em' }}>
              HR Management
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {visibleItems.map((item, i) => {
          if (item.section) {
            if (collapsed) return <div key={`s-${i}`} style={{ height: 16 }} />;
            return (
              <div
                key={`s-${i}`}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--sidebar-section)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '16px 12px 6px',
                  userSelect: 'none',
                }}
              >
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--sidebar-hover)';
                  e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--sidebar-text)';
                }
              }}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen && setMobileOpen(false)}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-text)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--sidebar-hover)';
            e.currentTarget.style.color = 'var(--sidebar-text-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
