import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MindmapModal({ open, onOpenChange }: MindmapModalProps) {
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
    </Dialog>
  );
}
