
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";
import MindMapViewer from "@/components/MindMapViewer";

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMindMapReady: (mindMap: any) => void;
  onExplainText: (text: string) => void;
}

const MindMapModal: React.FC<MindMapModalProps> = ({
  isOpen,
  onClose,
  onMindMapReady,
  onExplainText
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b flex flex-row items-center justify-between">
          <DialogTitle>Mind Map</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div ref={containerRef} className="flex-1 overflow-hidden h-full">
          <MindMapViewer
            isMapGenerated={true}
            onMindMapReady={onMindMapReady}
            onExplainText={onExplainText}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MindMapModal;
