import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faUsers,
  faCalendarCheck,
  faFingerprint,
  faMoneyBillWave,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      }
      showNotification('Welcome back! Login successful.', 'success');
      switch (response.user.role) {
        case 'HRAdmin':
        case 'Director':
          navigate('/admin/dashboard');
          break;
        case 'HOD':
          navigate('/hod/dashboard');
          break;
        default:
          navigate('/user/dashboard');
      }
    } catch (error: any) {
      showNotification(error.message || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: faUsers,
      title: 'Employee Self-Service',
      desc: 'Manage profiles, documents & requests',
    },
    {
      icon: faCalendarCheck,
      title: 'Leave Management',
      desc: 'Apply, track and approve leaves seamlessly',
    },
    {
      icon: faFingerprint,
      title: 'Attendance Tracking',
      desc: 'Real-time clock-in/out & timesheets',
    },
    {
      icon: faMoneyBillWave,
      title: 'Payroll Processing',
      desc: 'Automated payslips & tax calculations',
    },
  ];

  return (
    <div className="login-page">

      {/* ── Left: Brand / Visual Panel ── */}
      <div className="login-left">
        {/* Decorative orbs (CSS handles ::before/::after, these add extra) */}
        <div className="login-orb-2" />
        <div className="login-orb-3" />

        {/* Brand logo */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <div className="login-brand-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div>
              <div className="login-brand-name">UniHRMS</div>
              <div className="login-brand-tagline">University Human Resource Management</div>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="login-hero">
          <div className="login-hero-eyebrow">
            <span className="dot" />
            Trusted by 500+ Institutions
          </div>

          <h1>
            Manage your <span className="accent-text">workforce</span> with precision
          </h1>

          <p>
            A unified platform to streamline HR operations — from onboarding
            to payroll — all in one place, built for modern universities.
          </p>

          {/* Feature list */}
          <div className="login-features" style={{ marginTop: '32px' }}>
            {features.map((f, i) => (
              <div className="feature" key={i}>
                <div className="feature-icon">
                  <FontAwesomeIcon icon={f.icon} />
                </div>
                <div className="feature-text">
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="login-stats">
          <div className="login-stat-item">
            <span className="login-stat-value">12K+</span>
            <span className="login-stat-label">Active Employees</span>
          </div>
          <div className="login-stat-item">
            <span className="login-stat-value">98%</span>
            <span className="login-stat-label">Uptime SLA</span>
          </div>
          <div className="login-stat-item">
            <span className="login-stat-value">50+</span>
            <span className="login-stat-label">Departments</span>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="login-right">
        <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <span className="login-header-eyebrow">Secure Portal</span>
            <h2>Welcome back 👋</h2>
            <p>Sign in to access your HR dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="login-input-group">
              <FormInput
                label="Email Address"
                type="email"
                icon={faEnvelope}
                placeholder="you@university.edu"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="login-input-group">
              <div className="password-field">
                <FormInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={faLock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Options row */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 18, height: 18, borderWidth: 2, display: 'inline-block', marginRight: 8 }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="login-divider">
              <span>Demo credentials</span>
            </div>

            {/* Demo credentials */}
            <div className="demo-credentials">
              <p><strong>Admin:</strong> admin@university.edu / admin123</p>
              <p><strong>HOD:</strong> hod@university.edu / hod123</p>
              <p><strong>Employee:</strong> employee@university.edu / emp123</p>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;