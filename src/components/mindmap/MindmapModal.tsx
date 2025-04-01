
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define the DetailLevel enum that's being imported elsewhere
export enum DetailLevel {
  Low = "low",
  Medium = "medium",
  High = "high"
}

interface MindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MindmapModal({ open, onOpenChange }: MindmapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Generate Mind Map</DialogTitle>
        </DialogHeader>
        
        {/* Mind Map Content will go here */}
      </DialogContent>
    </Dialog>
  );
}
