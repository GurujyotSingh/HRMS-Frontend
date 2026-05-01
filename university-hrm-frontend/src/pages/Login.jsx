import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, toast } from '../components/ui';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

// Development helper — quick-fill credentials
const DEMO_ACCOUNTS = [
  { label: 'Admin',    email: 'super@university.edu',         role: 'SUPER_ADMIN' },
  { label: 'HR Mgr',  email: 'hr.manager@university.edu',    role: 'HR_MANAGER' },
  { label: 'Director', email: 'director.cs@university.edu',  role: 'DIRECTOR' },
  { label: 'Faculty',  email: 'faculty1@university.edu',     role: 'FACULTY' },
  { label: 'Staff',    email: 'staff1@university.edu',       role: 'STAFF' },
];
const DEMO_PASSWORD = 'Admin@123';

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [rememberMe, setRemember] = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter email and password', 'warning');
      return;
    }
    const result = await login(email, password, rememberMe);
    if (!result.ok) {
      toast(result.error || 'Login failed', 'error');
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1>UniHRM</h1>
          <p>University Human Resource Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              id="login-email"
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 10, top: 34,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gray-500)', padding: 4,
              }}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Remember me */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-500)', cursor: 'pointer', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            Remember me for 30 days
          </label>

          <Btn
            type="submit"
            loading={loading}
            style={{
              width: '100%',
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              marginTop: 8,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
              boxShadow: '0 4px 14px rgba(27, 110, 243, 0.35)',
              borderRadius: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            Sign In <ArrowRight size={16} />
          </Btn>
        </form>

        {/* Dev helper — demo accounts */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Dev quick-login (all: Admin@123)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  style={{
                    padding: '4px 10px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-active)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
