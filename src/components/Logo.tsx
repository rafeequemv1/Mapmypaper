
import React from 'react';

const Logo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 13.56 2H6a2 2 0 0 0-2 2z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M14 2v4a2 2 0 0 0 2 2h4M8 10h8M8 14h8M8 18h5" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);

export default Logo;
