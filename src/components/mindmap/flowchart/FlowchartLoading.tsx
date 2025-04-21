
import React from "react";

const FlowchartLoading = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
        <svg 
          className="animate-spin h-6 w-6 text-primary" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <div className="h-4 w-48 bg-primary/20 rounded mb-2"></div>
      <div className="h-3 w-32 bg-primary/10 rounded"></div>
    </div>
  </div>
);

export default FlowchartLoading;
