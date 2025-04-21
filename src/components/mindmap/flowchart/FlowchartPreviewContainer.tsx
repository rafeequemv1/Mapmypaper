
import React from "react";

interface FlowchartPreviewContainerProps {
  children: React.ReactNode;
}

const FlowchartPreviewContainer: React.FC<FlowchartPreviewContainerProps> = ({ children }) => (
  <div className="flex-1 p-1 bg-white rounded-md border border-gray-200 overflow-auto shadow-sm flex items-center justify-center relative">
    {children}
  </div>
);

export default FlowchartPreviewContainer;
