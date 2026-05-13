import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../services/api';
import AuthShell, { EyeIcon, StatusMessage } from '../components/AuthShell';

const ResetPassword = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(token, formData);
      setMessage(response.data.message);
      setFormData({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Choose a new password for your Hospital Management account."
      footer={
        !message ? (
          <>Need a new link? <Link to="/forgot-password">Request another reset</Link></>
        ) : (
          <>Remember your password? <Link to="/login">Sign in</Link></>
        )
      }
    >
      <StatusMessage>{error}</StatusMessage>
      <StatusMessage type="success">{message}</StatusMessage>

      {!message ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="6-20 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                maxLength={20}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Repeat new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                maxLength={20}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <EyeIcon hidden={showConfirm} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading || !token}>
            {loading ? <span className="spinner"></span> : 'Reset Password'}
          </button>
        </form>
      ) : (
        <Link to="/login" className="btn btn-primary auth-btn">Sign In</Link>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
