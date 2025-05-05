
import React from "react";
import { Loader2 } from "lucide-react";

const FlowchartLoading = () => (
  <div className="flex-1 flex items-center justify-center p-8 bg-white/50">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-primary"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">Generating Flowchart</p>
        <p className="text-sm text-gray-500 mt-1">This may take a few moments...</p>
      </div>
    </div>
  </div>
);

export default FlowchartLoading;
