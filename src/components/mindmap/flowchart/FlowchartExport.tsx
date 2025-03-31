
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlowchartExportProps {
  previewRef: React.RefObject<HTMLDivElement>;
}

const FlowchartExport = ({ previewRef }: FlowchartExportProps) => {
  const { toast } = useToast();

  const exportSvg = () => {
    if (!previewRef.current) {
      toast({
        title: "Export Failed",
        description: "No flowchart container found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const svgElement = previewRef.current.querySelector("svg");
    if (!svgElement) {
      toast({
        title: "Export Failed",
        description: "No flowchart to export. Please ensure your flowchart renders correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
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

  return (
    <div className="flex gap-2">
      <Button onClick={exportSvg} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export SVG
      </Button>
    </div>
  );
};

export default FlowchartExport;
