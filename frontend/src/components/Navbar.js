import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    const colors = {
      admin: { bg: '#fef3c7', color: '#92400e' },
      doctor: { bg: '#dbeafe', color: '#1e40af' },
      patient: { bg: '#d1fae5', color: '#065f46' }
    };
    const roleColors = colors[user?.role] || colors.patient;
    return (
      <span style={{ 
        background: roleColors.bg, 
        color: roleColors.color,
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {user?.role}
      </span>
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="brand-icon">
            <path d="M19 14c1.49-1.46 3-3.89 3-5.71c0-2.1-1.34-3.68-3.03-4.18c-.58-.17-1.18-.28-1.81-.38l-.61-.11c-.65-.09-1.31-.09-1.97-.09c-.65 0-1.31 0-1.96.09l-.6.11c-.63.1-1.23.21-1.82.38C6.34 4.61 5 6.19 5 8.29c0 1.82 1.51 4.25 3 5.71" />
            <path d="M12 22c4.97 0 9-3.31 9-7c0-2.69-1.86-4.89-4.45-5.71c-.59-.19-1.2-.3-1.83-.38l-.61-.11c-.66-.1-1.32-.1-1.98-.1s-1.32 0-1.98.1l-.61.11c-.63.1-1.24.2-1.83.38C6.86 10.11 5 12.31 5 15c0 3.69 4.03 7 9 7z" />
          </svg>
          <span>Hospital Management</span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <div className="navbar-user" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="user-avatar">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <span className="user-name">{user.firstName}</span>
                {getRoleBadge()}
                <svg viewBox="0 0 20 20" fill="currentColor" className={`chevron ${menuOpen ? 'open' : ''}`}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              {menuOpen && (
                <div className="navbar-dropdown">
                  <div className="dropdown-header">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1H3zm9.707 6.707a1 1 0 000-1.414l-3-3a1 1 0 00-1.414 1.414L10.586 9H4a1 1 0 100 1h6.586l-1.293 1.293a1 1 0 101.414 1.414l3-3z" clipRule="evenodd" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn-auth">Sign In</Link>
              <Link to="/register" className="btn-primary-small">Register</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #1e293b;
          font-weight: 600;
          font-size: 18px;
        }

        .brand-icon {
          width: 28px;
          height: 28px;
          color: #2563eb;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .navbar-user:hover {
          background: #f8fafc;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }

        .user-name {
          font-weight: 500;
          color: #1e293b;
        }

        .chevron {
          width: 16px;
          height: 16px;
          color: #64748b;
          transition: transform 0.2s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .navbar-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          overflow: hidden;
          animation: fadeIn 0.2s ease;
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .dropdown-header strong {
          display: block;
          color: #1e293b;
        }

        .dropdown-header span {
          font-size: 12px;
          color: #64748b;
        }

        .dropdown-divider {
          height: 1px;
          background: #e2e8f0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          color: #1e293b;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item svg {
          width: 18px;
          height: 18px;
          color: #64748b;
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout svg {
          color: #ef4444;
        }

        .btn-auth {
          padding: 8px 16px;
          color: #1e293b;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-auth:hover {
          color: #2563eb;
        }

        .btn-primary-small {
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary-small:hover {
          background: #1d4ed8;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .user-name {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;