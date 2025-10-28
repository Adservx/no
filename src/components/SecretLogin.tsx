import { useState, useEffect } from 'react';
import { authHelpers, supabase } from '../utils/supabase';
import '../styles/SecretLogin.css';

interface SecretLoginProps {
  onClose: () => void;
}

export const SecretLogin = ({ onClose }: SecretLoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data, error } = await authHelpers.signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (data.user) {
          setSuccess('Login successful!');
          setTimeout(() => onClose(), 1500);
        }
      } else {
        const { data, error } = await authHelpers.signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (data.user) {
          setSuccess('Sign up successful! Please check your email to verify your account.');
          setTimeout(() => {
            setIsLogin(true);
            setSuccess(null);
          }, 3000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="secret-login-overlay" onClick={onClose}>
      <div className="secret-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="secret-login-header">
          <h2>🕷️ Secret Access</h2>
          <p>{isLogin ? 'Enter your credentials' : 'Create an account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="secret-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="toggle-mode">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="toggle-button"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SecretLoginButtonProps {
  user: any;
  onLogout: () => void;
  onLoginClick: () => void;
  onAdminUploadClick?: () => void;
  onAdminManageClick?: () => void;
}

export const SecretLoginButton = ({ user, onLogout, onLoginClick, onAdminUploadClick, onAdminManageClick }: SecretLoginButtonProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      authHelpers.getUserRole().then(role => setUserRole(role));
    } else {
      setUserRole(null);
    }
  }, [user]);

  const handleAdminUpload = () => {
    setShowDropdown(false);
    if (onAdminUploadClick) {
      onAdminUploadClick();
    }
  };

  const handleAdminManage = () => {
    setShowDropdown(false);
    if (onAdminManageClick) {
      onAdminManageClick();
    }
  };

  return (
    <div className="secret-login-button-container">
      {user ? (
        <div className="user-menu">
          <button
            className="user-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
            title={user.email}
          >
            🕷️
          </button>
          {showDropdown && (
            <div className="user-dropdown">
              <div className="user-info">
                <p className="user-email">{user.email}</p>
                {userRole === 'admin' && (
                  <span className="admin-badge">👑 Admin</span>
                )}
              </div>
              {userRole === 'admin' && (
                <>
                  <button className="admin-upload-button" onClick={handleAdminUpload}>
                    📤 Upload Files
                  </button>
                  <button className="admin-manage-button" onClick={handleAdminManage}>
                    🗂️ Manage Files
                  </button>
                </>
              )}
              <button className="logout-button" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="secret-access-button" onClick={onLoginClick} title="Secret Login">
          🕷️
        </button>
      )}
    </div>
  );
};
