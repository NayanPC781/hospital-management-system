import React from 'react';

const EmptyState = ({ title, subtitle }) => (
  <div className="empty-state card">
    <p>{title}</p>
    {subtitle ? <span>{subtitle}</span> : null}
  </div>
);

export default EmptyState;
