
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Brain, FileText, MessageSquare, Download, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { signOut, user } = useAuth();
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
  
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully"
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive"
      });
    }
  }, [signOut, navigate, toast]);

  return (
    <header className="border-b bg-background p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <Brain className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium truncate max-w-xs md:max-w-md" title={documentTitle}>
          {documentTitle}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {pdfAvailable && (
          <Button 
            variant={showPdf ? "default" : "outline"} 
            size="sm"
            onClick={togglePdf}
            className="hidden md:flex"
          >
            <FileText className="mr-1 h-4 w-4" />
            PDF
          </Button>
        )}
        
        <Button 
          variant={showChat ? "default" : "outline"} 
          size="sm"
          onClick={toggleChat}
        >
          <MessageSquare className="mr-1 h-4 w-4" />
          <span className="hidden md:inline">Chat</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onOpenSummary}
        >
          Summary
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExportMindMap('svg')}>
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportMindMap('png')}>
              Export as PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
              <>
                <div className="px-2 py-1.5 text-sm">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
