import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import { useNotification } from '../../hooks/useNotification';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  if (!token) {
    return (
      <div className="reset-password-page">
        <Card className="reset-card">
          <div className="error-message">
            <h2>Invalid Link</h2>
            <p>The password reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="back-link">
              Request New Link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      showNotification('Password reset successful!', 'success');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="reset-password-page">
      <Card className="reset-card">
        <div className="reset-header">
          <h2>Reset Password</h2>
          <p>Please enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="password-field">
            <FormInput
              label="New Password"
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

          <div className="password-field">
            <FormInput
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              icon={faLock}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          <div className="password-requirements">
            <p>Password must contain:</p>
            <ul>
              <li className={formData.password.length >= 8 ? 'met' : ''}>
                At least 8 characters
              </li>
              <li className={/(?=.*[a-z])/.test(formData.password) ? 'met' : ''}>
                One lowercase letter
              </li>
              <li className={/(?=.*[A-Z])/.test(formData.password) ? 'met' : ''}>
                One uppercase letter
              </li>
              <li className={/(?=.*\d)/.test(formData.password) ? 'met' : ''}>
                One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Reset Password
          </Button>

          <Link to="/login" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Login
          </Link>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;