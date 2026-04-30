import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
          <p>Join the ETHARA.AI community managing their projects with clarity and confidence.</p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🚀</div>
              <span>Get started in under 60 seconds</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🎯</div>
              <span>Choose your role — Admin or Member</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📈</div>
              <span>Track progress with powerful dashboards</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card animate-fade-in">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Start managing your team's tasks today</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="glass-input"
                placeholder="Akshat Srivastava"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Role</label>
              <div className="role-selector">
                <div
                  className={`role-option ${role === 'member' ? 'selected' : ''}`}
                  onClick={() => setRole('member')}
                >
                  <div className="role-icon">👤</div>
                  <div className="role-name">Member</div>
                </div>
                <div
                  className={`role-option ${role === 'admin' ? 'selected' : ''}`}
                  onClick={() => setRole('admin')}
                >
                  <div className="role-icon">🛡️</div>
                  <div className="role-name">Admin</div>
                </div>
              </div>
            </div>
            <button type="submit" className="glass-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;