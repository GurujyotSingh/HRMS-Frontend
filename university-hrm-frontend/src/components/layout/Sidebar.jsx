import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  Wallet, ClipboardList, BarChart3, MessageSquare, ShieldCheck,
  ChevronLeft, ChevronRight, Megaphone, UserPlus, Target,
  Briefcase, Box, Receipt, Heart, Calendar, FileText, UserSearch
} from 'lucide-react';

const ALL_STAFF_ROLES = ['admin', 'hr', 'hr_staff', 'director', 'accountant', 'faculty', 'staff', 'employee'];

const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_STAFF_ROLES },

  { section: 'Management' },
  { path: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'hr', 'hr_staff'] },
  { path: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'hr', 'hr_staff'] },
  { path: '/recruitment', label: 'Recruitment', icon: UserSearch, roles: ['admin', 'hr', 'hr_staff'] },

  { section: 'Operations' },
  { path: '/leaves', label: 'Leaves', icon: CalendarDays, roles: ALL_STAFF_ROLES },
  { path: '/attendance', label: 'Attendance', icon: Clock, roles: ALL_STAFF_ROLES },
  { path: '/payroll', label: 'Payroll', icon: Wallet, roles: ALL_STAFF_ROLES },
  { path: '/onboarding', label: 'Onboarding and Offboarding', icon: ClipboardList, roles: ALL_STAFF_ROLES },
  { path: '/performance', label: 'Academic Evaluations', icon: Target, roles: ALL_STAFF_ROLES },

  { section: 'Communication' },
  { path: '/announcements', label: 'Announcements', icon: Megaphone, roles: ALL_STAFF_ROLES },

  { section: 'Intelligence' },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare, roles: ALL_STAFF_ROLES },

  { section: 'Admin' },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'hr', 'director'] },
  { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin'] },
];



const ROLE_LABELS = {
  admin: 'Admin',
  hr: 'HR Manager',
  hr_staff: 'HR Staff',
  director: 'Director',
  accountant: 'Accountant',
  employee: 'Employee',
  hod: 'HOD',
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { canAccess, user } = useAuth();
  const location = useLocation();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.section) return true;
    if (!item.roles) return true;
    return item.roles.some((r) => canAccess(r));
  });

  const visibleItems = filteredItems.filter((item, i, arr) => {
    if (!item.section) return true;
    const next = arr[i + 1];
    return next && !next.section;
  });

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';
  const roleName = user?.role?.name || 'staff';
  const roleLabel = ROLE_LABELS[roleName] || roleName;

  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'open' : ''}`}
      style={{
        width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
        background: 'linear-gradient(180deg, #1a1245 0%, #140d38 100%)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <style>{`
  /* Active nav item connects to the RIGHT side */
  .snav-active {
    position: relative !important;
    background: var(--bg) !important;
    color: var(--primary) !important;
    border-radius: 10px 0 0 10px !important;
    margin-right: 0;
    margin-left: 10px;
    box-shadow: none !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Concave corner ABOVE active item - RIGHT SIDE */
  .snav-active::before {
    content: '';
    position: absolute;
    right: 0;
    top: -20px;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 100% 0%, transparent 20px, var(--bg) 21px);
    pointer-events: none;
    z-index: 1;
    rotate: -90deg;
  }

  /* Concave corner BELOW active item - RIGHT SIDE */
  .snav-active::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: -20px;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 100% 100%, transparent 20px, var(--bg) 21px);
    pointer-events: none;
    z-index: 1;
    rotate: 90deg;
  }

  /* Hide scrollbar for sidebar nav */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`}</style>

      {/* ── Logo ──────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '22px 0' : '22px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--sidebar-border)',
        minHeight: 72,
        flexShrink: 0,
      }}>



        <div style={{
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 0.2s',
          overflow: 'hidden',
          textAlign: 'left',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>UniHRM</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>HR Portal</div>
        </div>

      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="hide-scrollbar" style={{
        flex: 1, overflowY: 'auto', overflowX: 'visible',
        padding: '10px 0 10px 10px',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {visibleItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={`s-${i}`} style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--sidebar-section)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '18px 10px 6px',
                textAlign: 'left',
                userSelect: 'none',
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap',
                height: 38 // Prevent layout jumping
              }}>
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
              title={collapsed ? item.label : undefined}
              className={isActive ? 'snav-active' : ''}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '10px 14px',
                marginLeft: isActive ? 0 : 10,
                marginRight: 0,
                marginBottom: 2,
                borderRadius: isActive ? '10px 0 0 10px' : 10,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                justifyContent: 'flex-start',
                position: 'relative',
                letterSpacing: '-0.01em',
                transition: isActive ? 'none' : 'all 0.18s ease',
                background: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--sidebar-text)',
                zIndex: isActive ? 2 : 'auto',
                whiteSpace: 'nowrap'
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
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ flexShrink: 0 }}
              />
              <span style={{
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Collapse Toggle - mirrored similarly */}
      {/* ... (I can add the full mirrored bottom part if you want) ... */}

    </aside >
  );
}