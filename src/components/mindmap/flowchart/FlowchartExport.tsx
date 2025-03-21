
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

  return (
    <div className="flex gap-2">
      <Button onClick={exportSvg} variant="ghost" size="sm" className="h-7">
        <Download className="h-3.5 w-3.5 mr-1" />
        <span className="text-xs">Export</span>
      </Button>
    </div>
  );
};

export default FlowchartExport;
