import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Badge, toast } from '../ui';
import { LogOut, ChevronDown, User, Settings, Menu, Moon, Sun, Search, Bell, Target, LayoutDashboard, Users, Building2, CalendarDays, Clock, Wallet, ClipboardList, Megaphone, MessageSquare, BarChart3, ShieldCheck, UserSearch } from 'lucide-react';

// --- Quick Search Modal Component ---
function QuickSearchModal({ open, onClose, canAccess }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // All possible routes
  const ALL_ROUTES = useMemo(() => [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
    { path: '/employees', label: 'Employee Directory', icon: Users, roles: ['admin', 'hr', 'hr_staff'] },
    { path: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'hr', 'hr_staff'] },
    { path: '/recruitment', label: 'Recruitment', icon: UserSearch, roles: ['admin', 'hr', 'hr_staff'] },
    { path: '/leaves', label: 'Leaves', icon: CalendarDays, roles: [] },
    { path: '/attendance', label: 'Attendance', icon: Clock, roles: [] },
    { path: '/payroll', label: 'Payroll', icon: Wallet, roles: [] },
    { path: '/onboarding', label: 'Onboarding', icon: ClipboardList, roles: [] },
    { path: '/performance', label: 'Performance', icon: Target, roles: [] },
    { path: '/announcements', label: 'Announcements', icon: Megaphone, roles: [] },
    { path: '/chat', label: 'AI Assistant', icon: MessageSquare, roles: [] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'hr', 'director'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin'] },
  ], []);

  // Filter based on roles and query
  const filteredRoutes = useMemo(() => {
    return ALL_ROUTES.filter(route => {
      // Check roles
      if (route.roles.length > 0 && !route.roles.some(r => canAccess(r))) return false;
      // Check query
      if (!query.trim()) return true;
      return route.label.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, canAccess, ALL_ROUTES]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filteredRoutes.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredRoutes.length) % Math.max(1, filteredRoutes.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredRoutes[activeIndex]) {
          navigate(filteredRoutes[activeIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredRoutes, activeIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cmd-modal">
        <div className="cmd-header">
          <Search size={20} className="cmd-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
          />
          <span className="cmd-esc">ESC</span>
        </div>
        <div className="cmd-body">
          {filteredRoutes.length > 0 ? (
            <>
              <div className="cmd-group-label">Navigation</div>
              {filteredRoutes.map((route, i) => {
                const Icon = route.icon;
                return (
                  <div
                    key={route.path}
                    className={`cmd-item ${i === activeIndex ? 'active' : ''}`}
                    onClick={() => { navigate(route.path); onClose(); }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <Icon size={16} className="cmd-item-icon" />
                    <span>{route.label}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="cmd-empty">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Topbar Component ---
export default function Topbar({ theme, toggleTheme, setMobileOpen }) {
  const { user, logout, canAccess } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropRef = useRef();
  const location = useLocation();

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  const ROLE_LABELS = {
    admin:     'Super Admin',
    hr:        'HR Manager',
    hr_staff:  'HR Staff',
    director:  'Director',
    faculty:   'Faculty',
    staff:     'Staff',
  };
  const roleName  = user?.role?.name || typeof user?.role === 'string' ? user.role.toLowerCase() : '';
  const roleLabel = ROLE_LABELS[roleName] || (roleName.charAt(0).toUpperCase() + roleName.slice(1).replace(/_/g, ' '));

  return (
    <>
      <header
        style={{
          height: 'var(--topbar-h)',
          background: 'var(--topbar-bg)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Left — Breadcrumb / Mobile menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--text-dark)'
            }}
          >
            <Menu size={20} />
          </button>
          
          <button className="topbar-search-btn" onClick={() => setSearchOpen(true)}>
            <Search size={14} />
            <span>Search UniHRM...</span>
            <span className="topbar-shortcut">Ctrl K</span>
          </button>
        </div>

        {/* Right — User menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          
          <button
            style={{
              background: 'transparent', border: 'none', color: 'var(--gray-500)',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: '50%', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray-500)'; }}
          >
            <Bell size={18} />
          </button>

          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent', border: 'none', color: 'var(--gray-500)',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: '50%', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray-500)'; }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--gray-200)' }}></div>

          <div style={{ position: 'relative' }} ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 6px', border: '1px solid transparent', borderRadius: '30px',
                background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-100)'; }}
              onMouseLeave={(e) => { if (!dropdownOpen) { e.currentTarget.style.background = 'transparent'; } }}
            >
              <Avatar name={displayName} size={32} />
              <div style={{ textAlign: 'left', display: 'none' }} className="user-text-mobile">
                {/* Responsive hide for small screens if needed, but handled globally */}
              </div>
              <ChevronDown
                size={14}
                style={{ color: 'var(--gray-500)', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 220,
                  background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden',
                  animation: 'fadeInScale 0.15s ease-out', zIndex: 200,
                }}
              >
                {/* User info header */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--white)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2, marginBottom: 8 }}>{user?.email}</div>
                  <Badge variant="info" style={{ fontSize: 10, padding: '2px 8px' }}>{roleLabel}</Badge>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px' }}>
                  {[
                    { icon: <User size={14} />, label: 'Profile', action: () => toast('Profile feature coming soon!', 'info') },
                    { icon: <Settings size={14} />, label: 'Settings', action: () => toast('Settings feature coming soon!', 'info') },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setDropdownOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', border: 'none', background: 'none', borderRadius: '8px',
                        fontSize: 13, color: 'var(--gray-600)', cursor: 'pointer', transition: 'all 0.1s', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--gray-600)'; }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div style={{ padding: '6px', borderTop: '1px solid var(--gray-100)' }}>
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', border: 'none', background: 'none', borderRadius: '8px',
                      fontSize: 13, color: '#dc2626', cursor: 'pointer', transition: 'all 0.1s',
                      fontWeight: 500, textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      <QuickSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        canAccess={canAccess}
      />
    </>
  );
}
