
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [flowchartContent, setFlowchartContent] = useState<string>(
`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[Result 1]
    D --> F[Result 2]`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (open) {
      try {
        // Initialize or refresh the flowchart when modal opens
        setTimeout(() => {
          if (window.mermaid) {
            window.mermaid.contentLoaded();
          }
        }, 100);
      } catch (error) {
        console.error("Error initializing flowchart:", error);
      }
    }
  }, [open, flowchartContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFlowchartContent(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    try {
      setIsGenerating(true);
      toast({
        title: "Feature coming soon",
        description: "Automatic flowchart generation will be available in a future update."
      });
      // Future AI generation code would go here
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flowchart",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        if (window.mermaid) {
          window.mermaid.contentLoaded();
        }
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Edit Flowchart Syntax</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGenerateFromPaper}
                disabled={isGenerating}
                className="text-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : "Generate from Paper"}
              </Button>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              value={flowchartContent}
              onChange={handleContentChange}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-semibold">Syntax Tips:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Use <code>graph TD</code> for top-down flowcharts</li>
                <li>Use <code>graph LR</code> for left-right flowcharts</li>
                <li>Node shapes: [Rectangle], (Rounded), {`{{Rhombus}}`}, {`{Diamond}`}</li>
                <li>Arrows: -->, --text-->, ==> (thick arrow)</li>
                <li>For more syntax, see the <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" className="text-blue-500 hover:underline">Mermaid documentation</a></li>
              </ul>
            </div>
          </div>
          
          {/* Flowchart preview */}
          <div className="w-full md:w-3/5 border rounded-md p-4 overflow-auto bg-white">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="mermaid-container overflow-auto">
              <div className="mermaid">{flowchartContent}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
