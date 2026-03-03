// src/pages/LoginPage.jsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email && password) {
        alert('Login successful! (Redirecting...)');
        window.location.href = '/admin/dashboard';
        // Later: navigate('/admin/dashboard')
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '40px 32px',
          width: '420px',
          maxWidth: '90%',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1E1760',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          University HRMS
        </h1>

        {error && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              borderLeft: '4px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <FontAwesomeIcon icon={faExclamationCircle} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faEnvelope}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                }}
              />
              <input
                type="email"
                placeholder="yourname@skips.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                backgroundColor: '#1E1760',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          Forgot password?{' '}
          <a
            href="#"
            style={{
              color: '#1E1760',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Reset here
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;