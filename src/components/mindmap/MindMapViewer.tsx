
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MindMapViewerProps {
  MindMapComponent: React.FC<any>;
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({ MindMapComponent }) => {
  return (
    <div className="w-full h-full">
      {MindMapComponent ? (
        <MindMapComponent />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-4 w-4/5">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-24 w-1/3" />
              <Skeleton className="h-24 w-1/3" />
              <Skeleton className="h-24 w-1/3" />
            </div>
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-24 w-1/4" />
              <Skeleton className="h-24 w-1/4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;
