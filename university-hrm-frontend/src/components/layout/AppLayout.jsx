import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI } from '../../services/api';
import { toast } from '../ui';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
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

  const { user } = useAuth();
  const [showIncompleteProfile, setShowIncompleteProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    pan_number: '', uan_number: '', bank_name: '', bank_account_number: '', ifsc_code: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user && (!user.pan_number || !user.uan_number || !user.bank_account_number)) {
      setShowIncompleteProfile(true);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await employeesAPI.updateMe(profileForm);
      toast('Profile details updated successfully', 'success');
      setShowIncompleteProfile(false);
      setTimeout(() => {
        window.location.reload(); // Refresh to update user context
      }, 1500);
    } catch (err) {
      toast('Failed to update profile details', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

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
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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

      {showIncompleteProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', maxWidth: '600px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '24px', fontWeight: 700 }}>Complete Your Profile</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
                Welcome to University Global! We need your mandatory statutory and banking details to successfully process your payroll.
              </p>
            </div>
            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAN Number *</label>
                <input required type="text" placeholder="ABCDE1234F" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.pan_number} onChange={e => setProfileForm(p => ({ ...p, pan_number: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UAN Number *</label>
                <input required type="text" placeholder="100XXXXXXXXX" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.uan_number} onChange={e => setProfileForm(p => ({ ...p, uan_number: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Name *</label>
                <input required type="text" placeholder="e.g. HDFC Bank" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.bank_name} onChange={e => setProfileForm(p => ({ ...p, bank_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Number *</label>
                <input required type="text" placeholder="XXXX XXXX XXXX" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.bank_account_number} onChange={e => setProfileForm(p => ({ ...p, bank_account_number: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IFSC Code *</label>
                <input required type="text" placeholder="HDFC0001234" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.ifsc_code} onChange={e => setProfileForm(p => ({ ...p, ifsc_code: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                <button type="submit" disabled={savingProfile} style={{ width: '100%', padding: '12px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: savingProfile ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: savingProfile ? 0.7 : 1 }} onMouseOver={e => !savingProfile && (e.target.style.backgroundColor = '#1d4ed8')} onMouseOut={e => !savingProfile && (e.target.style.backgroundColor = '#2563eb')}>
                  {savingProfile ? 'Saving Details...' : 'Save & Secure Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
