
import React from 'react';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface PanelStructureProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLayout?: number[];
  className?: string;
}

const PanelStructure = ({
  leftPanel,
  rightPanel,
  defaultLayout = [40, 60],
  className,
}: PanelStructureProps) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("min-h-[calc(100vh-4rem)] w-full", className)}
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={20}>
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        {rightPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
