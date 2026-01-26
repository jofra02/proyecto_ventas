import React from 'react';
import { ArrowLeft, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const POSLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <div className="pos-shell">
      <header className="pos-header">
        <div className="left-controls">
          {!isEmployee && (
            <button className="back-btn glass-effect" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
              <span>Exit Sale Mode</span>
            </button>
          )}
          <div className="pos-search">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Scan barcode or search item..." autoFocus />
          </div>
        </div>
        <div className="pos-info">
          {isEmployee ? (
            <button className="logout-btn-pos" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <div className="register-status">Register #1 • Online</div>
          )}
        </div>
      </header>

      <main className="pos-content">
        {children}
      </main>

      <style>{`
        .pos-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #e2e8f0;
        }

        .pos-header {
          height: 64px;
          background: #1e293b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }

        .left-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex: 1;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          font-size: 0.9rem;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-1px);
        }

        .pos-search {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .pos-search input {
          width: 100%;
          background: #0f172a;
          border: 1px solid #334155;
          color: white;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          border-radius: 6px;
        }
        .pos-search input:focus { outline: 2px solid #10b981; }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .register-status {
          font-size: 0.85rem;
          color: #10b981;
          font-weight: 500;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .logout-btn-pos {
          background: #ef4444;
          color: white;
          padding: 0.4rem 1rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }

        .pos-content {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default POSLayout;
