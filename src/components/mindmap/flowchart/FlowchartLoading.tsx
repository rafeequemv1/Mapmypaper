
import React from "react";

const FlowchartLoading = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-8 rounded-full bg-gray-300 mb-4"></div>
      <div className="h-4 w-48 bg-gray-300 rounded"></div>
    </div>
  </div>
);

export default FlowchartLoading;
