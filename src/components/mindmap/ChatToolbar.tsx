
import React from "react";
import { Plus, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatToolbarProps {
  onPlus?: () => void;
  micEnabled: boolean;
  onMicToggle: () => void;
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ onPlus, micEnabled, onMicToggle }) => {
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
      <Button
        variant={micEnabled ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={onMicToggle}
        aria-label="Toggle Microphone"
      >
        {micEnabled ? <Mic className="h-5 w-5 text-red-500" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <span className="text-xs text-muted-foreground ml-2">{micEnabled ? "Listening..." : "Mic Off"}</span>
    </div>
  );
};

export default ChatToolbar;
