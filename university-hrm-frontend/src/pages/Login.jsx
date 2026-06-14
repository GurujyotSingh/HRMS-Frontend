import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, toast } from '../components/ui';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';



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


      </div>
    </div>
  );
}
