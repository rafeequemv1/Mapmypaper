
import { Button } from "@/components/ui/button";
import { Download, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FlowchartExportProps {
  previewRef: React.RefObject<HTMLDivElement>;
  onToggleTheme?: () => void;
}

const FlowchartExport = ({ previewRef, onToggleTheme }: FlowchartExportProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportSvg = () => {
    if (!previewRef.current) {
      toast({
        title: "Export Failed",
        description: "No flowchart container found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const svgElement = previewRef.current.querySelector("svg");
      if (!svgElement) {
        toast({
          title: "Export Failed",
          description: "No flowchart to export. Please ensure your flowchart renders correctly.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set width and height attributes if not present
      if (!clonedSvg.hasAttribute("width") && clonedSvg.hasAttribute("viewBox")) {
        const viewBox = clonedSvg.getAttribute("viewBox")?.split(" ") || [];
        if (viewBox.length === 4) {
          clonedSvg.setAttribute("width", viewBox[2]);
          clonedSvg.setAttribute("height", viewBox[3]);
        }
      }

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "flowchart.svg";
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your flowchart has been exported as SVG.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the flowchart: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportSvg} variant="outline" size="sm" disabled={isExporting}>
        <Download className="h-4 w-4 mr-1" />
        {isExporting ? "Exporting..." : "Export SVG"}
      </Button>
      {onToggleTheme && (
        <Button onClick={onToggleTheme} variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-1" />
          Change Theme
        </Button>
      )}
    </div>
  );
};

export default FlowchartExport;
