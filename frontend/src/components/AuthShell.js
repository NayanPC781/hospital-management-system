import React, { useState } from 'react';
import '../styles/auth.css';

export const EyeIcon = ({ hidden = false }) => (
  hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a2 2 0 002.84 2.84" />
      <path d="M9.88 4.24A10.8 10.8 0 0112 4c5.25 0 9 4.5 10 8-0.4 1.38-1.2 2.83-2.35 4.08" />
      <path d="M6.61 6.6C4.27 8.05 2.75 10.45 2 12c1 3.5 4.75 8 10 8 1.52 0 2.91-.38 4.12-1.02" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.75-8 10-8 10 8 10 8-3.75 8-10 8S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);

export const StatusMessage = ({ type = 'error', children }) => {
  if (!children) return null;

  return (
    <div className={`auth-message auth-message-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {type === 'success' ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6" />
            <path d="M12 17h.01" />
          </>
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
};

const AuthIllustration = ({ mood }) => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    setPointer({ x, y });
  };

  const isPrivate = mood === 'private';
  const pupilStyle = {
    '--look-x': isPrivate ? '-5px' : `${pointer.x}px`,
    '--look-y': isPrivate ? '-3px' : `${pointer.y}px`
  };

  return (
    <div className="auth-art" onMouseMove={handleMouseMove} onMouseLeave={() => setPointer({ x: 0, y: 0 })}>
      <div className="auth-character auth-character-blue" style={pupilStyle}>
        <div className="auth-eyes">
          <span />
          <span />
        </div>
      </div>
      <div className="auth-character auth-character-slate" style={pupilStyle}>
        <div className="auth-eyes small">
          <span />
          <span />
        </div>
      </div>
      <div className="auth-character auth-character-mint" style={pupilStyle}>
        <div className="auth-dot-eyes">
          <span />
          <span />
        </div>
        <div className="auth-mouth" />
      </div>
      <div className="auth-character auth-character-coral" style={pupilStyle}>
        <div className="auth-dot-eyes">
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

const AuthShell = ({ eyebrow, title, subtitle, children, footer, mood = 'calm' }) => (
  <main className="auth-page">
    <section className="auth-showcase" aria-label="Hospital access overview">
      <div className="auth-showcase-copy">
        <p>{eyebrow}</p>
        <h2>Manage appointments, doctors, and patient </h2>
      </div>

      <AuthIllustration mood={mood} />

    </section>

    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-form-card">
        <header className="auth-header">
          <p>{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <span>{subtitle}</span>
        </header>
        {children}
        {footer && <p className="auth-footer">{footer}</p>}
      </div>
    </section>
  </main>
);

export default AuthShell;
