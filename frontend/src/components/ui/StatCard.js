import React from 'react';

const StatCard = ({ label, value, tone = 'neutral' }) => (
  <div className={`ui-stat-card ${tone}`}>
    <span className="ui-stat-value">{value}</span>
    <span className="ui-stat-label">{label}</span>
  </div>
);

export default StatCard;
