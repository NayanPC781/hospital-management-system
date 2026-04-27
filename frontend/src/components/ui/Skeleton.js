import React from 'react';
import { motion } from 'framer-motion';
import './Skeleton.css';

const Skeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height = '1em', 
  radius = 'var(--radius-sm)',
  className = '' 
}) => {
  return (
    <motion.div
      className={`skeleton skeleton-${variant} ${className}`}
      style={{ width, height, borderRadius: radius }}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton variant="rect" height="120px" radius="var(--radius-lg)" />
    <div className="skeleton-card-content">
      <Skeleton width="70%" height="20px" />
      <Skeleton width="40%" height="14px" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, className = '' }) => (
  <div className={`skeleton-list ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonStat = ({ className = '' }) => (
  <div className={`skeleton-stat ${className}`}>
    <Skeleton width="40px" height="32px" radius="var(--radius-sm)" />
    <Skeleton width="60px" height="12px" />
  </div>
);

export default Skeleton;