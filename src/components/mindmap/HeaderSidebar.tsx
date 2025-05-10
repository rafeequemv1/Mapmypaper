// This is a component file that manages the sidebar icons in the header
// We're removing any snapshot button references from here since it's now handled separately
import React from "react";
import { File, MessageSquare, Download, FileText, GitBranch } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderSidebarProps {
  isPdfActive: boolean;
  isChatActive: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
}

const HeaderSidebar = ({ 
  isPdfActive, 
  isChatActive, 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  onExportSVG,
  onExportPNG,
  onExportJSON
}: HeaderSidebarProps) => {
  return (
    <div className="fixed top-4 left-4 z-10 flex flex-col gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={togglePdf}
              className={`w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors ${
                isPdfActive ? "bg-gray-200" : ""
              }`}
              aria-label="Toggle PDF"
            >
              <File className="h-4 w-4 text-black" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isPdfActive ? "Hide PDF" : "Show PDF"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleChat}
              className={`w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors ${
                isChatActive ? "bg-gray-200" : ""
              }`}
              aria-label="Toggle Chat"
            >
              <MessageSquare className="h-4 w-4 text-black" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isChatActive ? "Hide Chat" : "Show Chat"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowSummary(true)}
              className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Show Summary"
            >
              <FileText className="h-4 w-4 text-black" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Show Summary
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowFlowchart(true)}
              className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Show Flowchart"
            >
              <GitBranch className="h-4 w-4 text-black" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Show Flowchart
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Export Options"
                >
                  <Download className="h-4 w-4 text-black" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={onExportSVG}>
                  Export as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPNG}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportJSON}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="right">
            Export Options
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default HeaderSidebar;
