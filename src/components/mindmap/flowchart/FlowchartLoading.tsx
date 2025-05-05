
import React from "react";

interface FlowchartLoadingProps {
  message?: string;
}

const FlowchartLoading: React.FC<FlowchartLoadingProps> = ({ 
  message = "Processing..." 
}) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-8 rounded-full bg-gray-300 mb-4"></div>
      <div className="h-4 w-48 bg-gray-300 rounded mb-2"></div>
      <div className="text-sm text-gray-500">{message}</div>
    </div>
  </div>
);

export default FlowchartLoading;
