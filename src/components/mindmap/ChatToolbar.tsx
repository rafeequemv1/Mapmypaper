
import React from "react";
import { Plus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatToolbarProps {
  onPlus?: () => void;
  onAttach?: () => void;
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ onPlus, onAttach }) => {
  return (
    <div className="flex gap-2 px-2 py-1 border-b bg-white items-center">
      {onPlus && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPlus}
          aria-label="Add PDF"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
      {onAttach && (
        <Button
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
          onClick={onAttach}
          aria-label="Attach File"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default ChatToolbar;
