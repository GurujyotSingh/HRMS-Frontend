import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#4361ee',
  fullScreen = false 
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  const spinnerSize = sizeMap[size];

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid ${color}20`,
    borderTopColor: color,
  };

  if (fullScreen) {
    return (
      <div className="fullscreen-spinner">
        <div className="spinner" style={spinnerStyle}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return <div className="spinner" style={spinnerStyle}></div>;
};

export default LoadingSpinner;