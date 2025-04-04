
import React from 'react';
import StatsDisplay from './StatsDisplay';

export interface StatsDisplayProps {
  className?: string;
  refreshInterval?: number;
}

// Fix the component to properly return JSX
const StatsDisplayWrapper: React.FC<StatsDisplayProps> = ({ className, refreshInterval }) => {
  return <StatsDisplay className={className} refreshInterval={refreshInterval} />;
};

export default StatsDisplayWrapper;
