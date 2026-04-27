import React, { useContext, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const roleMenus = {
  patient: [
    { to: '/patient', label: 'Overview', icon: 'home' },
    { to: '/patient?tab=book', label: 'Book Appointment', icon: 'calendar' },
    { to: '/patient?tab=history', label: 'My History', icon: 'clock' }
  ],
  doctor: [
    { to: '/doctor', label: 'Today', icon: 'calendar' },
    { to: '/doctor?tab=pending', label: 'Pending', icon: 'clock' },
    { to: '/doctor?tab=completed', label: 'Completed', icon: 'check' }
  ],
  admin: [
    { to: '/admin', label: 'Operations', icon: 'layout' },
    { to: '/admin?tab=doctors', label: 'Doctors', icon: 'stethoscope' },
    { to: '/admin?tab=patients', label: 'Patients', icon: 'users' }
  ]
};

const roleTitles = {
  patient: 'Patient Portal',
  doctor: 'Doctor Workspace',
  admin: 'Admin Console'
};

const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  stethoscope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.6A.6.6 0 0 1 5.4 2H8a2 2 0 0 1 2 2v1a6 6 0 0 0 2 4.6" />
      <path d="M8 12a6 6 0 0 0 4.966 5.827" />
      <path d="M4.8 17.4a.6.6 0 0 1-.6-.6v-2.8a2 2 0 0 1 2-2h2.4a2 2 0 0 1 2 2v2.8a.6.6 0 0 1-.6.6" />
      <circle cx="17" cy="8" r="3" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

const RoleLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menu = useMemo(() => roleMenus[user?.role] || [], [user?.role]);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`role-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="role-sidebar">
        <div className="role-brand">
          {!collapsed && (
            <>
              <span className="role-brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.89 3-5.71c0-2.1-1.34-3.68-3.03-4.18c-.58-.17-1.18-.28-1.81-.38l-.61-.11c-.65-.09-1.31-.09-1.97-.09c-.65 0-1.31 0-1.96.09l-.6.11c-.63.1-1.23.21-1.82.38C6.34 4.61 5 6.19 5 8.29c0 1.82 1.51 4.25 3 5.71" />
                  <path d="M12 22c4.97 0 9-3.31 9-7c0-2.69-1.86-4.89-4.45-5.71c-.59-.19-1.2-.3-1.83-.38l-.61-.11c-.66-.1-1.32-.1-1.98-.1s-1.32 0-1.98.1l-.61.11c-.63.1-1.24.2-1.83.38C6.86 10.11 5 12.31 5 15c0 3.69 4.03 7 9 7z" />
                </svg>
              </span>
              <div>
                <strong>Hospital</strong>
                <small>{roleTitles[user?.role] || 'Workspace'}</small>
              </div>
            </>
          )}
          {collapsed && (
            <span className="role-brand-icon role-brand-icon-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c4.97 0 9-3.31 9-7c0-2.69-1.86-4.89-4.45-5.71c-.59-.19-1.2-.3-1.83-.38l-.61-.11c-.66-.1-1.32-.1-1.98-.1s-1.32 0-1.98.1l-.61.11c-.63.1-1.24.2-1.83.38C6.86 10.11 5 12.31 5 15c0 3.69 4.03 7 9 7z" />
              </svg>
            </span>
          )}
        </div>

        <button 
          type="button" 
          className="role-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>

        <nav className="role-nav" aria-label="Role navigation">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `role-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="role-nav-icon">{icons[item.icon]}</span>
              {!collapsed && <span className="role-nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="role-sidebar-footer">
          <button type="button" className="role-nav-item role-logout" onClick={onLogout}>
            <span className="role-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {!collapsed && <span className="role-nav-label">Sign Out</span>}
          </button>
        </div>
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
