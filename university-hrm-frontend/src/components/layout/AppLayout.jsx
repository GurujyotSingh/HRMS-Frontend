import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI } from '../../services/api';
import { toast } from '../ui';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ForcePasswordChange from './ForcePasswordChange';

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
  const [profileStep, setProfileStep] = useState(1);
  const [profileForm, setProfileForm] = useState({
    // Financials
    pan_number: '', uan_number: '', bank_name: '', bank_account_number: '', ifsc_code: '',
    // Personal Details
    phone: '', date_of_birth: '', gender: '',
    // Address
    address_line1: '', city: '', state: '', postal_code: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      const pan = user.pan_number || user.financials?.pan_number;
      const uan = user.uan_number || user.financials?.uan_number;
      const acc = user.bank_account_number || user.financials?.bank_account_number;
      const ifsc = user.ifsc_code || user.financials?.ifsc_code;
      const bank_name = user.bank_name || user.financials?.bank_name || user.financials?.bank_branch?.bank_name;
      const phone = user.phone;
      const dob = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
      const gender = user.gender;
      
      const addr = user.address || {};
      
      setProfileForm(prev => ({
        ...prev,
        pan_number: pan || '',
        uan_number: uan || '',
        bank_account_number: acc || '',
        ifsc_code: ifsc || '',
        bank_name: bank_name || '',
        phone: phone || '',
        date_of_birth: dob || '',
        gender: gender || '',
        address_line1: addr.street || addr.address_line1 || '',
        city: addr.city || '',
        state: addr.state || '',
        postal_code: addr.pincode || addr.postal_code || ''
      }));

      if (!pan || !uan || !acc || !phone || !dob) {
        setShowIncompleteProfile(true);
      }
    }
  }, [user]);

  const handleIfscBlur = async (e) => {
    e.target.style.borderColor = '#cbd5e1';
    const code = profileForm.ifsc_code;
    if (code && code.length === 11) {
      if (code === 'DEMO0001234') {
        setProfileForm(p => ({ ...p, bank_name: 'Demo Test Bank' }));
        toast('Bank found: Demo Test Bank', 'success');
        return;
      }
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${code}`);
        if (res.ok) {
          const data = await res.json();
          setProfileForm(p => ({ ...p, bank_name: data.BANK }));
          toast(`Bank found: ${data.BANK}`, 'success');
        } else {
          toast('Invalid IFSC Code. Please verify.', 'error');
        }
      } catch (err) {
        console.error('IFSC fetch failed', err);
      }
    }
  };

  const handlePinBlur = async (e) => {
    e.target.style.borderColor = '#cbd5e1';
    const code = profileForm.postal_code;
    if (code && code.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setProfileForm(p => ({ 
              ...p, 
              city: postOffice.District || postOffice.Block, 
              state: postOffice.State 
            }));
            toast(`PIN verified: ${postOffice.District}, ${postOffice.State}`, 'success');
          } else {
            toast('Invalid PIN Code. Please verify.', 'error');
            setProfileForm(p => ({ ...p, city: '', state: '' }));
          }
        }
      } catch (err) {
        console.error('PIN fetch failed', err);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileStep === 1) {
      setProfileStep(2);
      return;
    }
    
    setSavingProfile(true);
    try {
      const payload = {
        phone: profileForm.phone,
        date_of_birth: profileForm.date_of_birth ? new Date(profileForm.date_of_birth).toISOString() : null,
        gender: profileForm.gender,
        address: {
          address_line1: profileForm.address_line1,
          city: profileForm.city,
          state: profileForm.state,
          postal_code: profileForm.postal_code,
          country: 'India'
        },
        financials: {
          pan_number: profileForm.pan_number,
          uan_number: profileForm.uan_number,
          ifsc_code: profileForm.ifsc_code,
          bank_name: profileForm.bank_name,
          bank_account_number: profileForm.bank_account_number
        }
      };
      
      await employeesAPI.updateMe(payload);
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

  if (user?.needs_password_change) {
    return (
      <ForcePasswordChange 
        user={user} 
        onComplete={() => window.location.reload()} 
      />
    );
  }

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
          <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', maxWidth: '600px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '24px', fontWeight: 700 }}>Complete Your Profile</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
                Welcome to University Global! We need your mandatory statutory and banking details to successfully process your payroll.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: profileStep >= 1 ? '#2563eb' : '#e2e8f0', color: profileStep >= 1 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>1</div>
                <div style={{ height: '2px', width: '40px', background: profileStep >= 2 ? '#2563eb' : '#e2e8f0' }}></div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: profileStep >= 2 ? '#2563eb' : '#e2e8f0', color: profileStep >= 2 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>2</div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {profileStep === 1 ? (
                <>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Personal Details</h3>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number *</label>
                    <input required type="tel" placeholder="e.g. 9876543210" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth *</label>
                    <input required type="date" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={profileForm.date_of_birth} onChange={e => setProfileForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender *</label>
                    <select required style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: 'white' }} value={profileForm.gender} onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="" disabled>Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Residential Address</h3>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address Line 1 *</label>
                    <input required type="text" placeholder="Street Address" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={profileForm.address_line1} onChange={e => setProfileForm(p => ({ ...p, address_line1: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City *</label>
                    <input required type="text" placeholder="Auto-fetched via PIN" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#f8fafc' }} readOnly value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State *</label>
                    <input required type="text" placeholder="Auto-fetched via PIN" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#f8fafc' }} readOnly value={profileForm.state} onChange={e => setProfileForm(p => ({ ...p, state: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postal Code *</label>
                    <input required type="text" placeholder="6-digit PIN Code" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={handlePinBlur} value={profileForm.postal_code} onChange={e => setProfileForm(p => ({ ...p, postal_code: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Financial Details</h3>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAN Number *</label>
                    <input required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)" type="text" placeholder="ABCDE1234F" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none', textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.pan_number} onChange={e => setProfileForm(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UAN Number *</label>
                    <input required pattern="^\d{12}$" title="UAN must be exactly 12 digits" type="text" placeholder="100XXXXXXXXX" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.uan_number} onChange={e => setProfileForm(p => ({ ...p, uan_number: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IFSC Code *</label>
                    <input required pattern="^[A-Z]{4}0[A-Z0-9]{6}$" title="Must be 11 characters, starting with 4 letters followed by a zero, then 6 alphanumeric characters" type="text" placeholder="HDFC0001234" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none', textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={handleIfscBlur} value={profileForm.ifsc_code} onChange={e => setProfileForm(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Name *</label>
                    <input required type="text" placeholder="e.g. HDFC Bank" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none', background: '#f8fafc' }} readOnly onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.bank_name} onChange={e => setProfileForm(p => ({ ...p, bank_name: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Number *</label>
                    <input required pattern="^\d{9,18}$" title="Account number must be between 9 and 18 digits" type="text" placeholder="XXXX XXXX XXXX" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} value={profileForm.bank_account_number} onChange={e => setProfileForm(p => ({ ...p, bank_account_number: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                </>
              )}

              <div style={{ gridColumn: '1 / -1', marginTop: '12px', display: 'flex', gap: '12px' }}>
                {profileStep === 2 && (
                  <button type="button" onClick={() => setProfileStep(1)} style={{ padding: '12px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                    Back
                  </button>
                )}
                <button type="submit" disabled={savingProfile} style={{ flex: profileStep === 2 ? 2 : 1, padding: '12px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: savingProfile ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: savingProfile ? 0.7 : 1 }}>
                  {profileStep === 1 ? 'Next Step' : (savingProfile ? 'Saving Details...' : 'Save & Secure Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
