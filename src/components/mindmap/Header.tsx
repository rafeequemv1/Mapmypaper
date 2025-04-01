
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessageSquare, ChevronLeft, BookText, BarChart, FileText, User } from "lucide-react";
import { Link } from "react-router-dom";
import AuthButton from "../auth/AuthButton";
import { User as TUser } from "@supabase/supabase-js";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  setShowMindmap: (show: boolean) => void;
  user: TUser | null;
  onAuthChange: () => Promise<void>;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary, 
  setShowFlowchart,
  setShowMindmap,
  user,
  onAuthChange 
}: HeaderProps) => {
  return (
    <header className="border-b py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-black text-white p-1 rounded-md">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm hidden sm:inline-block">Back</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-xl font-medium">mapmypaper</h1>
            <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
              BETA
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* PDF Toggle Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1.5"
            onClick={togglePdf}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">PDF</span>
          </Button>
          
          {/* Chat Toggle Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1.5"
            onClick={toggleChat}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">Chat</span>
          </Button>
          
          {/* Mindmap Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowMindmap(true)}
          >
            <BookText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">Mindmap</span>
          </Button>
          
          {/* Flowchart Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowFlowchart(true)}
          >
            <BarChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">Flowchart</span>
          </Button>
          
          {/* Summary Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowSummary(true)}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">Summary</span>
          </Button>
          
          <AuthButton user={user} onAuthChange={onAuthChange} variant="outline" size="sm" />
        </div>
      </div>
    </header>
  );
};

export default Header;
