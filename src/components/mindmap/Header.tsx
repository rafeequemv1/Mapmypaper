
import React from "react";
import { BookOpen, MoveLeft, MessageSquare, Download, Braces, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { MindElixirInstance } from "mind-elixir";
import HeaderExportMenu from "./HeaderExportMenu";
import HeaderSidebar from "./HeaderSidebar";
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
    <header className="h-16 border-b flex justify-between bg-white">
      <div className="flex items-center pl-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          title="Back to Home"
        >
          <MoveLeft className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-purple-600 mr-2" />
          <h1 className="text-lg font-bold">MapMyPaper</h1>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <ApiStatusIndicator status={apiStatus} onRetry={handleApiRetry} />
      </div>

      <div className="flex items-center">
        <Button
          variant={isPdfActive ? "default" : "outline"}
          onClick={togglePdf}
          className={`flex items-center ${
            isPdfActive ? "bg-gray-800" : ""
          } mr-2`}
          title={isPdfActive ? "Hide PDF" : "Show PDF"}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
        <Button
          variant={isChatActive ? "default" : "outline"}
          onClick={toggleChat}
          className={`flex items-center ${
            isChatActive ? "bg-gray-800" : ""
          } mr-2`}
          title={isChatActive ? "Hide Chat" : "Show Chat"}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Chat</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowSummary(true)}
          className="flex items-center mr-2"
          title="Generate Summary"
        >
          <BookOpen className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Summary</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowMermaid(true)}
          className="flex items-center mr-2"
          title="Generate Flowchart"
        >
          <Braces className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Flowchart</span>
        </Button>
        <HeaderExportMenu mindMap={mindMap} />
        <HeaderSidebar />
      </div>
    </header>
  );
};

export default Header;
