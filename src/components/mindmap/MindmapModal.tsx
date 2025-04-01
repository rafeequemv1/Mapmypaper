
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useMindmapGenerator, defaultMindmap } from "./flowchart/useMindmapGenerator";
import useMermaidInit from "./flowchart/useMermaidInit";

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MindmapModal = ({ isOpen, onClose }: MindmapModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    code,
    error,
    isGenerating,
    generateMindmap,
    handleCodeChange
  } = useMindmapGenerator();

  // Initialize mermaid
  useMermaidInit();

  // Render the mindmap whenever code changes
  useEffect(() => {
    if (!isOpen) return;

    const renderMindmap = async () => {
      try {
        const { svg } = await mermaid.render('mindmap-diagram', code);
        setMermaidSvg(svg);
      } catch (error) {
        console.error('Error rendering mindmap:', error);
        setMermaidSvg(`<div class="p-4 text-red-500">Error: Failed to render mindmap</div>`);
        toast({
          title: "Rendering Error",
          description: "Failed to render mindmap. Please check your syntax.",
          variant: "destructive",
        });
      }
    };

    renderMindmap();
  }, [code, isOpen, toast]);

  // Reset to default when closed
  useEffect(() => {
    if (!isOpen) {
      // Don't reset on close to preserve user's work
      setActiveTab("editor");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription>
            Create a mindmap visualization based on your PDF content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 my-2">
          <Button 
            variant="outline" 
            onClick={() => generateMindmap()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate from PDF"
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          {/* Editor Tab */}
          <TabsContent 
            value="editor" 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="flex-1 p-4 font-mono text-sm resize-none border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your mindmap code here..."
              spellCheck="false"
            />
          </TabsContent>
          
          {/* Preview Tab */}
          <TabsContent 
            value="preview" 
            className="flex-1 overflow-auto bg-white border rounded-md"
          >
            {mermaidSvg ? (
              <div 
                className="w-full h-full flex items-center justify-center overflow-auto p-4"
                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">Loading preview...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={onClose} className="mr-2">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MindmapModal;
