
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Markmaper } from "./Markmaper";

interface MarkMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MarkMapModal = ({ open, onOpenChange }: MarkMapModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Mind Map</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <Markmaper />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarkMapModal;
