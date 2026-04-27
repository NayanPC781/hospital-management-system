import React from 'react';

const DetailDrawer = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="ui-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="ui-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label={title}
      >
        <header className="ui-drawer-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
        </header>
        <div className="ui-drawer-body">{children}</div>
      </aside>
    </div>
  );
};

export default DetailDrawer;
