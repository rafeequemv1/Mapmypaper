
import React from "react";

interface FlowchartPreviewContainerProps {
  children: React.ReactNode;
}

const FlowchartPreviewContainer: React.FC<FlowchartPreviewContainerProps> = ({ children }) => (
  <div className="flex-1 p-1 bg-white rounded-md border overflow-auto flex items-center justify-center">
    {children}
  </div>
);

export default FlowchartPreviewContainer;
