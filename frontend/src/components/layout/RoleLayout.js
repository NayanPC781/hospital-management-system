import React, { useContext, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const roleMenus = {
  patient: [
    { to: '/patient', label: 'Overview' },
    { to: '/patient?tab=book', label: 'Book' },
    { to: '/patient?tab=history', label: 'History' }
  ],
  doctor: [
    { to: '/doctor', label: 'Agenda' },
    { to: '/doctor?tab=pending', label: 'Pending' },
    { to: '/doctor?tab=completed', label: 'Completed' }
  ],
  admin: [
    { to: '/admin', label: 'Operations' },
    { to: '/admin?tab=doctors', label: 'Doctors' },
    { to: '/admin?tab=patients', label: 'Patients' }
  ]
};

const roleTitles = {
  patient: 'Patient Portal',
  doctor: 'Doctor Workspace',
  admin: 'Admin Console'
};

const RoleLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useMemo(() => roleMenus[user?.role] || [], [user?.role]);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="role-shell">
      <aside className="role-sidebar">
        <div className="role-brand">
          <span className="role-brand-dot" />
          <div>
            <strong>Hospital</strong>
            <small>{roleTitles[user?.role] || 'Workspace'}</small>
          </div>
        </div>

        <nav className="role-nav" aria-label="Role navigation">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `role-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="role-content-wrap">
        <header className="role-topbar">
          <div className="role-topbar-title">
            <h1>{roleTitles[user?.role] || 'Dashboard'}</h1>
          </div>
          <div className="role-user-menu">
            <button
              type="button"
              className="role-user-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
            >
              <span className="role-user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              <span>{user?.firstName} {user?.lastName}</span>
            </button>
            {menuOpen && (
              <div className="role-user-dropdown">
                <p>{user?.email}</p>
                <button type="button" onClick={onLogout}>Sign Out</button>
              </div>
            )}
          </div>
        </header>
        <main className="role-main">{children}</main>
      </div>
    </div>
  );
};

export default RoleLayout;
