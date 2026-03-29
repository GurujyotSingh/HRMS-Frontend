import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/ui';

const demos = [
  { label: 'Admin', email: 'admin@uni.edu', password: 'admin123' },
  { label: 'HR', email: 'hr@uni.edu', password: 'hr123' },
  { label: 'HOD', email: 'hod.cs@uni.edu', password: 'hod123' },
  { label: 'Accountant', email: 'accountant@uni.edu', password: 'acc123' },
  { label: 'Employee', email: 'employee@uni.edu', password: 'emp123' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onLogin = async () => {
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        style={{
          flex: 1,
          minWidth: 320,
          background: 'linear-gradient(160deg, var(--soil) 0%, var(--bark) 100%)',
          color: 'var(--linen)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
        <h1 style={{ fontSize: 36, marginBottom: 16, color: 'var(--cream)' }}>UniHRM</h1>
        <p style={{ fontSize: 17, opacity: 0.9, maxWidth: 400, lineHeight: 1.6 }}>
          University Human Resource Management — attendance, leave, payroll, and performance in one
          calm, professional workspace.
        </p>
        <div style={{ marginTop: 36 }}>
          <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>
            Quick demo login
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {demos.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(232,201,154,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--sand)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 320,
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 8 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Use your university credentials.</p>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          <Btn size="lg" loading={loading} onClick={onLogin} style={{ width: '100%' }}>
            Continue
          </Btn>
        </div>
      </div>
    </div>
  );
}
