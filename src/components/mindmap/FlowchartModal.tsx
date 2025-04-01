import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FlowchartModal({ open, onOpenChange }: FlowchartModalProps) {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [flowchartCode, setFlowchartCode] = useState("");
  const { toast } = useToast();

  const generateFlowchart = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to generate a flowchart",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example Mermaid flowchart code
      const generatedCode = `
graph TD
    A[Start] --> B{Is it a research paper?}
    B -->|Yes| C[Extract key concepts]
    B -->|No| D[Identify main topics]
    C --> E[Create hierarchical structure]
    D --> E
    E --> F[Generate mind map]
    F --> G[End]
      `;
      
      setFlowchartCode(generatedCode.trim());
      
      toast({
        title: "Flowchart generated",
        description: "Your flowchart has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate flowchart. Please try again.",
        variant: "destructive",
      });
      console.error("Error generating flowchart:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Flowchart</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="input" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Enter text or concepts to generate a flowchart. For best results, describe the process or relationship between concepts clearly.
              </p>
              <Textarea 
                placeholder="Enter text to generate a flowchart..." 
                className="min-h-[200px]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={generateFlowchart} 
              disabled={isGenerating || !inputText.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : "Generate Flowchart"}
            </Button>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-auto">
            {flowchartCode ? (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Mermaid Flowchart Code:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {flowchartCode}
                </pre>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview:</h3>
                  <div className="bg-white border rounded p-4">
                    <p className="text-gray-500 text-center">
                      [Flowchart visualization would appear here]
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  Generate a flowchart to see the preview
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
