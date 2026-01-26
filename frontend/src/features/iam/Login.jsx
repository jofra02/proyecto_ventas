import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(username, password);
      // Role-based redirect
      if (user.role === 'EMPLOYEE') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card animate-fade-in">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your ERP account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-field">
            <User size={18} />
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="input-field">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-btn login-btn">Sign In</button>
        </form>
      </div>

      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0b1120;
          background-image: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.2) 0%, transparent 70%);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 3rem;
          text-align: center;
        }

        .login-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: var(--text-muted);
          margin-bottom: 2.5rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-field {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        .input-field input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
          font-size: 1rem;
        }

        .login-btn {
          padding: 1rem !important;
          font-size: 1rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
