
import React from "react";
import {
  Download,
  Image,
  FileJson
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MindElixirInstance } from "mind-elixir";
import { exportMapToSVG, exportMapToPNG, exportMapToJSON } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface HeaderExportMenuProps {
  mindMap: MindElixirInstance | null;
}

const HeaderExportMenu: React.FC<HeaderExportMenuProps> = ({ mindMap }) => {
  const { toast } = useToast();
  
  const handleExportSVG = () => {
    if (!mindMap) {
      toast({
        title: "No Mind Map Available",
        description: "Please upload a PDF document first to create a mind map.",
        variant: "destructive",
      });
      return;
    }
    exportMapToSVG(mindMap, "mindmap");
  };

  const handleExportPNG = () => {
    if (!mindMap) {
      toast({
        title: "No Mind Map Available",
        description: "Please upload a PDF document first to create a mind map.",
        variant: "destructive",
      });
      return;
    }
    exportMapToPNG(mindMap, "mindmap");
  };

  const handleExportJSON = () => {
    if (!mindMap) {
      toast({
        title: "No Mind Map Available",
        description: "Please upload a PDF document first to create a mind map.",
        variant: "destructive",
      });
      return;
    }
    exportMapToJSON(mindMap, "mindmap");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center"
          title="Export"
        >
          <Download className="h-4 w-4 text-black" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportSVG} className="flex items-center gap-2 cursor-pointer">
          <Image className="h-4 w-4" />
          <span>Export as SVG</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG} className="flex items-center gap-2 cursor-pointer">
          <Image className="h-4 w-4" />
          <span>Export as PNG</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} className="flex items-center gap-2 cursor-pointer">
          <FileJson className="h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderExportMenu;
