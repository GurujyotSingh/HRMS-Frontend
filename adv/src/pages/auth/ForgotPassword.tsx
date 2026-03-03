import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import { useNotification } from '../../hooks/useNotification';

const ForgotPassword: React.FC = () => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      showNotification('Reset link sent to your email', 'success');
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="forgot-password-page">
        <Card className="forgot-card">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Check Your Email</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="small">
              Didn't receive the email? Check your spam folder or{' '}
              <button onClick={() => setSubmitted(false)}>try again</button>
            </p>
            <Link to="/login" className="back-link">
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Login
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <Card className="forgot-card">
        <div className="forgot-header">
          <h2>Forgot Password?</h2>
          <p>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Email Address"
            type="email"
            icon={faEnvelope}
            placeholder="john.doe@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Send Reset Link
          </Button>

          <Link to="/login" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Login
          </Link>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;