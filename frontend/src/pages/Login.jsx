import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="auth-left">
        <div className="auth-branding animate-fade-in">
          <div className="auth-branding-logo">Task Manager</div>
          <p>Streamline ETHARA.AI's workflow with intelligent task management, real-time collaboration, and actionable insights.</p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📊</div>
              <span>Real-time project analytics & progress tracking</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">👥</div>
              <span>Role-based team collaboration</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">⚡</div>
              <span>Smart task prioritization & deadlines</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card animate-fade-in">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to continue to your workspace</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="glass-input"
                placeholder="you@ethara.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup" className="auth-link">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;