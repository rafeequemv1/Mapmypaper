
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";
import { getAllPdfs } from "@/components/PdfTabs";
import { defaultFlowchart, cleanMermaidSyntax } from "./utils/flowchartDefaults";
import { generateWithRetry } from "./utils/retryUtils";
import { useFlowchartCache } from "./hooks/useFlowchartCache";

export { defaultFlowchart } from "./utils/flowchartDefaults";

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { getCachedFlowchart, setCachedFlowchart } = useFlowchartCache();

  const generateFlowchart = async (pdfKey: string | null = null) => {
    try {
      setIsGenerating(true);
      setError(null);
      setRetryCount(0);
      
      // Check if we have any PDFs loaded
      const allPdfs = getAllPdfs();
      if (allPdfs.length === 0) {
        setError("No PDFs available. Please upload a PDF first.");
        setCode(defaultFlowchart);
        toast({
          title: "No PDFs Found",
          description: "Please upload a PDF document before generating a flowchart.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for invalid or "add-pdf" key
      if (pdfKey === "add-pdf") {
        pdfKey = null;
      }
      
      // Try to initialize mermaid
      try {
        await mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true
          },
          logLevel: 5
        });
      } catch (initError) {
        console.warn("Non-critical mermaid initialization warning:", initError);
      }
      
      // Check cache and generate new flowchart
      const cachedFlowchart = getCachedFlowchart(pdfKey);
      if (cachedFlowchart) {
        setCode(cachedFlowchart);
        toast({
          title: "Using Cached Flowchart",
          description: "Showing cached flowchart while generating a new one...",
        });
      }

      // Generate new flowchart with retry logic
      const generateFunction = () => generateFlowchartFromPdf(pdfKey);
      const flowchartCode = await generateWithRetry(generateFunction, retryCount);
      
      // Cache successful flowchart
      setCachedFlowchart(pdfKey, flowchartCode);

      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      // Verify syntax
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Flowchart Generated",
          description: "A flowchart has been created based on your PDF content.",
        });
      } catch (parseError) {
        handleParseError(parseError, cleanedCode);
      }
    } catch (err: any) {
      handleGenerationError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleParseError = (parseError: any, cleanedCode: string) => {
    console.error("Mermaid parse error:", parseError);
    
    if (parseError instanceof Error && 
       (parseError.message.includes('dynamically imported module') || 
        parseError.message.includes('Failed to fetch'))) {
      setError(`Module loading error: The browser had trouble loading the flowchart rendering components.`);
      setCode(cleanedCode);
      
      toast({
        title: "Rendering Issue",
        description: "Using simplified flowchart due to module loading issues.",
        variant: "warning",
      });
    } else {
      setError(`Invalid flowchart syntax. Using default instead.`);
      setCode(defaultFlowchart);
      
      toast({
        title: "Syntax Error",
        description: "The generated flowchart had syntax errors. Using a default template instead.",
        variant: "destructive",
      });
    }
  };

  const handleGenerationError = (err: any) => {
    console.error("Failed to generate flowchart:", err);
    setCode(defaultFlowchart);
    setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    
    toast({
      title: "Generation Failed",
      description: "An unexpected error occurred. Using default template.",
      variant: "destructive",
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  return {
    code,
    error,
    isGenerating,
    generateFlowchart,
    handleCodeChange
  };
};

export default useFlowchartGenerator;
