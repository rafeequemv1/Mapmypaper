
import { Brain, ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
}

const Header = ({ 
  showPdf, 
  togglePdf, 
  pdfAvailable, 
  showChat, 
  toggleChat 
}: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="py-2 px-4 border-b bg-[#222222] flex items-center">
      <div className="flex items-center gap-2 w-1/3">
        <Brain className="h-5 w-5 text-white" />
        <h1 className="text-base font-medium text-white">PaperMind</h1>
        
        <Button variant="ghost" size="sm" className="text-white ml-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
      
      {/* Center section - Research Assistant toggle button */}
      <div className="flex items-center justify-center w-1/3">
        <Toggle 
          pressed={showChat} 
          onPressedChange={toggleChat}
          aria-label="Toggle research assistant"
          className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Research Assistant</span>
        </Toggle>
      </div>
      
      {/* PDF toggle on the right */}
      <div className="flex items-center justify-end gap-4 w-1/3">
        {pdfAvailable && (
          <Toggle 
            pressed={showPdf} 
            onPressedChange={togglePdf}
            aria-label="Toggle PDF view"
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">PDF</span>
          </Toggle>
        )}
      </div>
    </div>
  );
};

export default Header;
