
import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import ChatPanel from "@/components/mindmap/ChatPanel";

interface MobileChatSheetProps {
  onScrollToPdfPosition: (position: string) => void;
  explainText?: string;
  explainImage?: string;
}

const MobileChatSheet = ({ 
  onScrollToPdfPosition, 
  explainText,
  explainImage 
}: MobileChatSheetProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2 md:hidden">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90%] p-0">
        <div className="h-full flex flex-col">
          <div className="shrink-0 flex items-center justify-between p-3 border-b">
            <h3 className="text-lg font-semibold">Chat</h3>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              toggleChat={() => setOpen(false)} 
              initialText={explainText}
              explainImage={explainImage} 
              onScrollToPdfPosition={onScrollToPdfPosition}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileChatSheet;
