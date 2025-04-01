
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SequenceDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SequenceDiagramModal = ({ open, onOpenChange }: SequenceDiagramModalProps) => {
  const { toast } = useToast();

  // Redirect to flowchart modal with sequence diagram tab when opened
  useEffect(() => {
    if (open) {
      toast({
        title: "Redirecting",
        description: "Sequence diagrams are now available directly in the diagram editor.",
      });
      // Close this modal
      onOpenChange(false);
    }
  }, [open, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redirecting...</DialogTitle>
          <DialogDescription>
            Sequence diagrams are now available directly in the diagram editor.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SequenceDiagramModal;
