
import { Button } from "@/components/ui/button";
import { Download, Palette, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface FlowchartExportProps {
  previewRef: React.RefObject<HTMLDivElement>;
  onToggleTheme?: () => void;
}

const FlowchartExport = ({ previewRef, onToggleTheme }: FlowchartExportProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Initialize Crisp in hidden state when component mounts
  useEffect(() => {
    if (window.$crisp) {
      // Hide the chat widget initially
      window.$crisp.push(["do", "chat:hide"]);
    }
  }, []);

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
    } finally {
      setIsExporting(false);
    }
  };

  // Function to open Crisp chat
  const openCrispChat = () => {
    if (window.$crisp) {
      // First, make the chat widget visible
      window.$crisp.push(["do", "chat:show"]);
      
      // Then open the chat
      window.$crisp.push(["do", "chat:open"]);
      
      toast({
        title: "Chat Opened",
        description: "Our support team is ready to help you.",
      });
    } else {
      toast({
        title: "Chat Unavailable",
        description: "The chat service is currently unavailable. Please try again later.",
        variant: "destructive",
      });
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
      <Button onClick={openCrispChat} variant="outline" size="sm">
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FlowchartExport;
