
import React from "react";
import { Button } from "@/components/ui/button";

interface PdfSnapshotIndicatorProps {
  isSnapshotMode: boolean;
  isProcessingCapture: boolean;
  handleCancelSnapshot: () => void;
}

const PdfSnapshotIndicator: React.FC<PdfSnapshotIndicatorProps> = ({
  isSnapshotMode,
  isProcessingCapture,
  handleCancelSnapshot
}) => {
  if (!isSnapshotMode) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
      <span>{isProcessingCapture ? "Processing capture..." : "Draw to capture area"}</span>
      {!isProcessingCapture && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 bg-blue-600 hover:bg-blue-700 p-1 h-6" 
          onClick={handleCancelSnapshot}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

export default PdfSnapshotIndicator;
