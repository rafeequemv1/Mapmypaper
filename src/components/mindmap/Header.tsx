
import React from "react";
import { BookOpen, MessageSquare, Download, Braces, Users, Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { MindElixirInstance } from "mind-elixir";
import HeaderExportMenu from "./HeaderExportMenu";
import ApiStatusIndicator from "./ApiStatusIndicator";
import { testGeminiConnection } from "@/services/geminiService";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowMermaid: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  apiStatus: 'idle' | 'loading' | 'error' | 'success';
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  togglePdf,
  toggleChat,
  setShowSummary,
  setShowMermaid,
  isPdfActive,
  isChatActive,
  mindMap,
  apiStatus,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleApiRetry = async () => {
    try {
      await testGeminiConnection();
    } catch (error) {
      console.error("API connection retry failed:", error);
    }
  };

  return (
    <div className={`flex flex-col h-full py-4 border-r bg-white ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          title="Back to Home"
          className="mb-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Separator className="w-2/3 mx-auto" />
        
        <div className="flex items-center justify-center mb-2">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        
        <ApiStatusIndicator 
          status={apiStatus} 
          onRetry={handleApiRetry} 
          orientation="vertical"
        />
        
        <Button
          variant={isPdfActive ? "default" : "ghost"}
          onClick={togglePdf}
          size="icon"
          className={`${isPdfActive ? "bg-gray-800" : ""}`}
          title={isPdfActive ? "Hide PDF" : "Show PDF"}
        >
          <BookOpen className="h-5 w-5" />
        </Button>
        
        <Button
          variant={isChatActive ? "default" : "ghost"}
          onClick={toggleChat}
          size="icon"
          className={`${isChatActive ? "bg-gray-800" : ""}`}
          title={isChatActive ? "Hide Chat" : "Show Chat"}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setShowSummary(true)}
          size="icon"
          title="Generate Summary"
        >
          <BookOpen className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setShowMermaid(true)}
          size="icon"
          title="Generate Flowchart"
        >
          <Braces className="h-5 w-5" />
        </Button>
        
        <HeaderExportMenu mindMap={mindMap} vertical />
      </div>
    </div>
  );
};

export default Header;
