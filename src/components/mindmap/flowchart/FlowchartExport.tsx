
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlowchartExportProps {
  previewRef: React.RefObject<HTMLDivElement>;
}

const FlowchartExport = ({ previewRef }: FlowchartExportProps) => {
  const { toast } = useToast();

  const exportSvg = () => {
    if (!previewRef.current || !previewRef.current.querySelector("svg")) {
      toast({
        title: "Export Failed",
        description: "No flowchart to export. Please ensure your flowchart renders correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgElement = previewRef.current.querySelector("svg");
      const svgData = new XMLSerializer().serializeToString(svgElement!);
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
    }
  };

  const exportPng = async () => {
    if (!previewRef.current || !previewRef.current.querySelector("svg")) {
      toast({
        title: "Export Failed",
        description: "No flowchart to export. Please ensure your flowchart renders correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgElement = previewRef.current.querySelector("svg")!;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Get SVG dimensions
      const bbox = svgElement.getBBox();
      canvas.width = bbox.width * 2; // Scale up for better quality
      canvas.height = bbox.height * 2;
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        // Convert canvas to PNG
        canvas.toBlob((blob) => {
          if (!blob) return;
          
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "flowchart.png";
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          
          toast({
            title: "Export Successful",
            description: "Your flowchart has been exported as PNG.",
          });
        }, "image/png");
      };
      
      img.src = url;
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the flowchart: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportSvg} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export SVG
      </Button>
      <Button onClick={exportPng} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export PNG
      </Button>
    </div>
  );
};

export default FlowchartExport;
