import React from 'react';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status || 'pending'}`}>{status || 'pending'}</span>
);

export default StatusBadge;
