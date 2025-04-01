
import { Button } from "@/components/ui/button";
import { Download, Palette, FileImage } from "lucide-react";
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
  
  const exportPng = () => {
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
      
      // Get dimensions from viewBox or set defaults
      let width = 1200;
      let height = 800;
      
      if (clonedSvg.hasAttribute("viewBox")) {
        const viewBox = clonedSvg.getAttribute("viewBox")?.split(" ") || [];
        if (viewBox.length === 4) {
          width = parseInt(viewBox[2]);
          height = parseInt(viewBox[3]);
        }
      }
      
      // Set explicit width and height on the SVG
      clonedSvg.setAttribute("width", width.toString());
      clonedSvg.setAttribute("height", height.toString());
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      
      // Create a canvas element
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      // Create an image from the SVG
      const img = new Image();
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      
      img.onload = () => {
        if (ctx) {
          // Draw white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the SVG image
          ctx.drawImage(img, 0, 0);
          
          // Convert to PNG and download
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "flowchart.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast({
            title: "Export Successful",
            description: "Your flowchart has been exported as PNG.",
          });
        }
        setIsExporting(false);
      };
      
      img.onerror = (err) => {
        console.error("Image loading error:", err);
        toast({
          title: "Export Failed",
          description: "Failed to create PNG from SVG.",
          variant: "destructive",
        });
        setIsExporting(false);
      };
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the flowchart: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportSvg} variant="outline" size="sm" disabled={isExporting}>
        <Download className="h-4 w-4 mr-1" />
        {isExporting ? "Exporting..." : "Export SVG"}
      </Button>
      <Button onClick={exportPng} variant="outline" size="sm" disabled={isExporting}>
        <FileImage className="h-4 w-4 mr-1" />
        {isExporting ? "Exporting..." : "Export PNG"}
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
