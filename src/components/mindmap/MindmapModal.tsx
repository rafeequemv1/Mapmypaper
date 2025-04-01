
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the DetailLevel type
export type DetailLevel = 'simple' | 'detailed' | 'advanced';

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (detailLevel: DetailLevel) => void;
}

const MindmapModal = ({ isOpen, onClose, onGenerate }: MindmapModalProps) => {
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('detailed');

  const handleGenerate = () => {
    onGenerate(detailLevel);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Mindmap</DialogTitle>
          <DialogDescription>
            Create a visual mindmap representation from your PDF document
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="detail-level" className="text-right">
              Detail Level
            </Label>
            <Select 
              value={detailLevel} 
              onValueChange={(value: DetailLevel) => setDetailLevel(value)}
            >
              <SelectTrigger id="detail-level" className="col-span-3">
                <SelectValue placeholder="Select detail level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MindmapModal;
