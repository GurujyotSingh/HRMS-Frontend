import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('hrm_theme') || 'light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hrm_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidth = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />
      
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="mobile-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90
          }}
        />
      )}

      <div
        className="app-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Topbar 
          theme={theme} 
          toggleTheme={toggleTheme} 
          setMobileOpen={setMobileOpen} 
        />
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          <div style={{ animation: 'fadeIn 0.25s ease-out', maxWidth: 1400 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
