
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
  onSwitchToFlowchart: () => void;
}

const SequenceDiagramModal = ({ open, onOpenChange, onSwitchToFlowchart }: SequenceDiagramModalProps) => {
  const { toast } = useToast();

  // Redirect to flowchart modal with sequence diagram tab when opened
  useEffect(() => {
    if (open) {
      toast({
        title: "Redirecting",
        description: "Sequence diagrams are now available directly in the diagram editor.",
      });
      // Close this modal and open the flowchart modal
      onOpenChange(false);
      setTimeout(() => {
        onSwitchToFlowchart();
      }, 100);
    }
  }, [open, onOpenChange, onSwitchToFlowchart, toast]);

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
