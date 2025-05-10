
import React from "react";
import {
  Download,
  FileImage,
  FileCode,
  FileJson
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface HeaderExportMenuProps {
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
}

const HeaderExportMenu: React.FC<HeaderExportMenuProps> = ({
  onExportSVG,
  onExportPNG,
  onExportJSON
}) => (
  <TooltipProvider>
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <button
              className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Export"
            >
              <Download className="h-4 w-4 text-black" />
            </button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent side="right">
          Export mind map
        </TooltipContent>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onExportSVG} className="flex items-center gap-2 cursor-pointer">
            <FileCode className="h-4 w-4" />
            <span>Export as SVG</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPNG} className="flex items-center gap-2 cursor-pointer">
            <FileImage className="h-4 w-4" />
            <span>Export as PNG</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJSON} className="flex items-center gap-2 cursor-pointer">
            <FileJson className="h-4 w-4" />
            <span>Export as JSON</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  </TooltipProvider>
);

export default HeaderExportMenu;
