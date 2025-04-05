
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, X } from "lucide-react";
import { VisualizationType } from "@/hooks/use-visualization";

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationType: VisualizationType;
  mermaidSyntax: string;
  onSyntaxChange: (syntax: string) => void;
  isGenerating: boolean;
  onRegenerate: () => void;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({
  isOpen,
  onClose,
  visualizationType,
  mermaidSyntax,
  onSyntaxChange,
  isGenerating,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "syntax">("preview");
  
  // Handle syntax change
  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSyntaxChange(e.target.value);
  };
  
  const title = "Visualization";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] flex flex-col overflow-hidden p-4">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "preview" | "syntax")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="syntax">Edit Content</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRegenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>
          </div>
          
          <TabsContent 
            value="preview" 
            className="flex-1 overflow-auto border rounded-md p-4 bg-white"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  <p>Generating visualization...</p>
                </div>
              </div>
            ) : mermaidSyntax ? (
              <div className="visualization-container overflow-auto h-full w-full flex items-center justify-center">
                <pre className="whitespace-pre-wrap">{mermaidSyntax}</pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No visualization available. Click Regenerate to create one.
              </div>
            )}
          </TabsContent>
          
          <TabsContent 
            value="syntax" 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <p className="text-sm text-gray-500 mb-2">
              Edit the content below to customize your visualization:
            </p>
            <Textarea 
              value={mermaidSyntax} 
              onChange={handleSyntaxChange}
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              placeholder="Enter your content here..."
              disabled={isGenerating}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizationModal;
