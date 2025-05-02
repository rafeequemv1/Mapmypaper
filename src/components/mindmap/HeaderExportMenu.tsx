
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MindElixirInstance } from "mind-elixir";
import { exportMarkmap, exportPdf, exportPng, exportSvg } from "@/lib/export-utils";

interface HeaderExportMenuProps {
  mindMap: MindElixirInstance | null;
  vertical?: boolean;
}

const HeaderExportMenu: React.FC<HeaderExportMenuProps> = ({ mindMap, vertical = false }) => {
  if (!mindMap) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size={vertical ? "icon" : "default"} disabled className={vertical ? "" : "flex items-center gap-2"}>
            <Download className="h-5 w-5" />
            {!vertical && <span>Export</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={vertical ? "right" : "bottom"}>
          <p>No mindmap to export</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={vertical ? "icon" : "default"} className={vertical ? "" : "flex items-center gap-2"}>
          <Download className="h-5 w-5" />
          {!vertical && <span>Export</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align={vertical ? "end" : "center"} side={vertical ? "right" : "bottom"}>
        <div className="grid gap-1">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => exportPng(mindMap)}
          >
            Export as PNG
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => exportSvg(mindMap)}
          >
            Export as SVG
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => exportPdf(mindMap)}
          >
            Export as PDF
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => exportMarkmap(mindMap)}
          >
            Export as HTML
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HeaderExportMenu;
