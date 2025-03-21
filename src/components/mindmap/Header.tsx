
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, FileText, MessageSquare, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap: (type: 'svg' | 'png') => void;
  onOpenSummary: () => void;
}

const Header = ({
  showPdf,
  togglePdf,
  pdfAvailable,
  showChat,
  toggleChat,
  onExportMindMap,
  onOpenSummary,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documentTitle, setDocumentTitle] = useState<string>("Document Analysis");
  
  // Extract document title from sessionStorage
  useEffect(() => {
    try {
      // Try to get the file name from session storage
      const pdfFileName = sessionStorage.getItem('pdfFileName');
      if (pdfFileName) {
        // If filename exists, use it
        setDocumentTitle(pdfFileName);
      }
    } catch (error) {
      console.error("Error retrieving document title:", error);
    }
  }, []);
  
  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <header className="border-b border-[#eaeaea] dark:border-[#333] bg-white dark:bg-[#111] p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleGoHome} className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#222]">
          <Brain className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium truncate max-w-xs md:max-w-md text-black dark:text-white" title={documentTitle}>
          MapMyPaper - {documentTitle}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {pdfAvailable && (
          <Button 
            variant={showPdf ? "default" : "outline"} 
            size="sm"
            onClick={togglePdf}
            className={`hidden md:flex ${
              showPdf 
                ? "bg-black text-white dark:bg-white dark:text-black" 
                : "text-black border-black dark:text-white dark:border-white"
            }`}
          >
            <FileText className="mr-1 h-4 w-4" />
            PDF
          </Button>
        )}
        
        <Button 
          variant={showChat ? "default" : "outline"} 
          size="sm"
          onClick={toggleChat}
          className={
            showChat 
              ? "bg-black text-white dark:bg-white dark:text-black" 
              : "text-black border-black dark:text-white dark:border-white"
          }
        >
          <MessageSquare className="mr-1 h-4 w-4" />
          <span className="hidden md:inline">Chat</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onOpenSummary}
          className="text-black border-black dark:text-white dark:border-white"
        >
          Summary
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="text-black border-black dark:text-white dark:border-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-[#222] border-[#eaeaea] dark:border-[#333]">
            <DropdownMenuItem 
              onClick={() => onExportMindMap('svg')}
              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
            >
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExportMindMap('png')}
              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
            >
              Export as PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleGoHome}
          className="text-black border-black dark:text-white dark:border-white"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
