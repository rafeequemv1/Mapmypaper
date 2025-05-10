
import React from "react";
import { Camera } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SnapshotButtonProps {
  enableSnapshotMode: () => void;
}

const SnapshotButton: React.FC<SnapshotButtonProps> = ({ enableSnapshotMode }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={enableSnapshotMode}
            className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Take snapshot"
          >
            <Camera className="h-4 w-4 text-black" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Take snapshot
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SnapshotButton;
