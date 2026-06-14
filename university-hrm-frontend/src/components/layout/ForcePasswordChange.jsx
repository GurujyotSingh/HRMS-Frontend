import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { toast } from '../ui';
import { Lock } from 'lucide-react';

export default function ForcePasswordChange({ user, onComplete }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'warning');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast('Password updated successfully! Welcome.', 'success');
      onComplete(); // Triggers a reload or refetch of user data
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', maxWidth: '440px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', marginBottom: 16 }}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: 700 }}>Action Required</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
            For your security, you must set a new password before you can access the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Temporary Password</label>
            <input required type="password" placeholder="Enter the temporary password" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
            <input required type="password" placeholder="Min 8 characters" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password</label>
            <input required type="password" placeholder="Confirm your new password" style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '8px', padding: '12px 16px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
