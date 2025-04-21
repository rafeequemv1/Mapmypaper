
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";
import { MindmapModal } from "./MindmapModal";
import FlowchartModal from "./FlowchartModal";

interface MindmapTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'mindmap' | 'flowchart';
}

const MindmapTabsModal = ({ isOpen, onClose, type }: MindmapTabsModalProps) => {
  // Use the active PDF from the main interface
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  useEffect(() => {
    // Listen for PDF switch events from other components
    const handlePdfSwitch = (event: CustomEvent) => {
      if (event.detail?.pdfKey) {
        setActivePdfKey(event.detail.pdfKey);
      }
    };
    
    window.addEventListener('pdfSwitched', handlePdfSwitch as EventListener);
    return () => {
      window.removeEventListener('pdfSwitched', handlePdfSwitch as EventListener);
    };
  }, []);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActivePdfKey(key);
    // Notify other components about PDF switch
    window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: key } }));
  };

  return (
    <>
      {type === 'mindmap' && (
        <MindmapModal isOpen={isOpen} onClose={onClose} />
      )}
      
      {type === 'flowchart' && (
        <FlowchartModal open={isOpen} onOpenChange={onClose} />
      )}
    </>
  );
};

export default MindmapTabsModal;
