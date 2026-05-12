import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import AuthShell, { StatusMessage } from '../components/AuthShell';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.forgotPassword({ email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email linked to your account and we will send reset instructions."
      footer={(
        <>
          Remember your password? <Link to="/login">Sign in</Link>
        </>
      )}
    >
        <form onSubmit={handleSubmit} className="auth-form">
          <StatusMessage>{error}</StatusMessage>
          <StatusMessage type="success">{message}</StatusMessage>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your account email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setMessage('');
              }}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Send reset link'}
          </button>
        </form>
    </AuthShell>
  );
};

export default ForgotPassword;
