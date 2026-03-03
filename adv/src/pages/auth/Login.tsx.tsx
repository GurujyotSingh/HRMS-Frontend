import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import Card from '../../components/ui/Card';
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
      newErrors.email = 'Email is invalid';
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
      
      showNotification('Login successful!', 'success');
      
      // Redirect based on role
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
      showNotification(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <h1>University HRMS</h1>
            <p>Human Resource Management System</p>
          </div>
          <div className="login-features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Employee Self-Service</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Leave Management</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Attendance Tracking</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Payroll Processing</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <Card className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Please sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Email Address"
                type="email"
                icon={faEnvelope}
                placeholder="john.doe@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                disabled={loading}
              />

              <div className="password-field">
                <FormInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={faLock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>

              <div className="login-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="large"
                loading={loading}
              >
                Sign In
              </Button>

              <div className="demo-credentials">
                <p>Demo Credentials:</p>
                <p>admin@university.edu / admin123 (Admin)</p>
                <p>hod@university.edu / hod123 (HOD)</p>
                <p>employee@university.edu / emp123 (Employee)</p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;