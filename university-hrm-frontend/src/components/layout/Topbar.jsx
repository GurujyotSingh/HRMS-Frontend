import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Badge } from '../ui';
import { LogOut, ChevronDown, User, Settings, Menu, Moon, Sun } from 'lucide-react';

export default function Topbar({ theme, toggleTheme, setMobileOpen }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.first_name
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
  const roleName  = user?.role?.name || '';
  const roleLabel = ROLE_LABELS[roleName] || (roleName.charAt(0).toUpperCase() + roleName.slice(1).replace(/_/g, ' '));

  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--white)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Left — Breadcrumb / Page area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--text-dark)'
          }}
        >
          <Menu size={20} />
        </button>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 400 }}>
          University HRM
        </div>
      </div>

      {/* Right — User menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--gray-100)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-dark)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px 6px 6px',
              border: '1px solid transparent',
              borderRadius: '50%',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gray-100)';
              e.currentTarget.style.borderColor = 'var(--gray-200)';
            }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <Avatar name={displayName} size={32} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', lineHeight: 1.2 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 400 }}>
                {roleLabel}
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--gray-500)',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: 220,
                background: 'var(--white)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                animation: 'fadeInScale 0.15s ease-out',
                zIndex: 200,
              }}
            >
              {/* User info header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--gray-200)',
                  background: 'var(--gray-100)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                  {user?.email}
                </div>
                <Badge variant="info" style={{ marginTop: 6 }}>
                  {roleLabel}
                </Badge>
              </div>

              {/* Menu items */}
              <div style={{ padding: '4px' }}>
                {[
                  { icon: <User size={14} />, label: 'Profile', action: () => { } },
                  { icon: <Settings size={14} />, label: 'Settings', action: () => { } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: '6px',
                      fontSize: 13,
                      color: 'var(--text-light)',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--gray-100)';
                      e.currentTarget.style.color = 'var(--text-dark)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = 'var(--text-light)';
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div style={{ padding: '4px', borderTop: '1px solid var(--gray-200)' }}>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    borderRadius: '6px',
                    fontSize: 13,
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
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
  );
}
