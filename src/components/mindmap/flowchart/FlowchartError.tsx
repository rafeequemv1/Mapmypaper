
import React from "react";

interface FlowchartErrorProps {
  error: string;
}

const FlowchartError: React.FC<FlowchartErrorProps> = ({ error }) => (
  <div className="flex-1 p-4 overflow-auto">
    <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
      <h3 className="font-bold mb-2">Error</h3>
      <pre className="whitespace-pre-wrap text-sm overflow-auto">{error}</pre>
      <p className="mt-4 text-sm">Using default flowchart template instead.</p>
    </div>
  </div>
);

export default FlowchartError;
