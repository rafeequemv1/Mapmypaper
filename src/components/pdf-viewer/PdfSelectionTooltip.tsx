
import React from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PositionedTooltip } from "@/components/ui/tooltip";

interface PdfSelectionTooltipProps {
  showTooltip: boolean;
  position: { x: number; y: number };
  tooltipRef: React.RefObject<HTMLDivElement>;
  handleExplainText: () => void;
}

const PdfSelectionTooltip: React.FC<PdfSelectionTooltipProps> = ({
  showTooltip,
  position,
  tooltipRef,
  handleExplainText
}) => {
  if (!showTooltip) return null;

  return (
    <PositionedTooltip
      ref={tooltipRef}
      show={showTooltip}
      x={position.x}
      y={position.y - 40} // Offset it above the text
      className="transform -translate-x-1/2 shadow-lg"
    >
      <Button 
        size="sm" 
        variant="ghost"
        className="flex items-center gap-1 text-xs p-1 h-7"
        onClick={handleExplainText}
      >
        <MessageSquare className="h-3 w-3" />
        <span>Explain</span>
      </Button>
    </PositionedTooltip>
  );
};

export default PdfSelectionTooltip;
