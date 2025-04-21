
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";
import { getAllPdfs } from "@/components/PdfTabs";

export const defaultFlowchart = `flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    
    class A,C,D default
    class B decision`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with flowchart directive and LR direction
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else if (cleaned.startsWith("flowchart TD")) {
    // Convert TD to LR for left-to-right layout
    cleaned = cleaned.replace("flowchart TD", "flowchart LR");
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with flowchart, subgraph, or end
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end' ||
        line.trim().startsWith('class')) {
      return line;
    }
    
    // Fix arrows if needed
    let processedLine = line.replace(/-+>/g, "-->");
    
    // Replace any hyphens in node IDs with underscores
    processedLine = processedLine.replace(/(\b\w+)-(\w+\b)(?!\]|\)|\})/g, "$1_$2");
    
    // Handle date ranges by replacing hyphens with underscores
    processedLine = processedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
    processedLine = processedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
    processedLine = processedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
    
    // Replace problematic hyphens in node text with spaces
    // Handle multiple iterations to catch all hyphens
    for (let i = 0; i < 3; i++) {
      // Square brackets []
      processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Parentheses ()
      processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Curly braces {}
      processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
    }
    
    return processedLine;
  });
  
  // Add color classes if they don't exist
  let result = processedLines.join('\n');
  
  if (!result.includes('classDef')) {
    result += `
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    classDef danger fill:#FFDEE2,stroke:#EF4444,stroke-width:2px
    classDef info fill:#D3E4FD,stroke:#3B82F6,stroke-width:2px
    classDef neutral fill:#FDE1D3,stroke:#F97316,stroke-width:2px`;
  }
  
  return result;
};

/**
 * Wait for a specified amount of time
 * @param ms Time to wait in milliseconds
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  /**
   * Try to generate a flowchart with exponential backoff for rate limit errors
   */
  const generateFlowchartWithRetry = async (pdfKey: string | null = null, maxRetries = 3): Promise<string> => {
    try {
      return await generateFlowchartFromPdf(pdfKey);
    } catch (error: any) {
      // Check if this is a rate limit error (429)
      if (error.message && error.message.includes('429') && retryCount < maxRetries) {
        // Calculate exponential backoff time (1s, 2s, 4s, etc.)
        const backoffTime = Math.pow(2, retryCount) * 1000;
        
        console.log(`Rate limit reached. Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        // Increment retry count
        setRetryCount(retryCount + 1);
        
        // Wait for backoff time
        await wait(backoffTime);
        
        // Try again
        return generateFlowchartWithRetry(pdfKey, maxRetries);
      }
      
      // If not a rate limit error or we've exhausted retries, throw the error
      throw error;
    }
  };

  const generateFlowchart = async (pdfKey: string | null = null) => {
    try {
      setIsGenerating(true);
      setError(null);
      setRetryCount(0); // Reset retry count
      
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
        setIsGenerating(false);
        return;
      }
      
      // Check for invalid or "add-pdf" key
      if (pdfKey === "add-pdf") {
        pdfKey = null; // Reset to null to use the default PDF
      }
      
      // Try to initialize mermaid with minimal configuration to avoid module loading issues
      try {
        await mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true
          },
          logLevel: 5 // Enable detailed logging
        });
      } catch (initError) {
        console.warn("Non-critical mermaid initialization warning:", initError);
      }
      
      let flowchartCode: string;
      
      try {
        // Try to get cached flowchart for this PDF first
        const cachedFlowchart = sessionStorage.getItem(`cachedFlowchart_${pdfKey || 'default'}`);
        
        // Check session storage for a previously generated and cached flowchart
        if (cachedFlowchart) {
          // Use cached flowchart first while attempting to generate a new one in the background
          setCode(cachedFlowchart);
          toast({
            title: "Using Cached Flowchart",
            description: "Showing cached flowchart while generating a new one...",
          });
        }
        
        // Generate new flowchart with retry logic
        flowchartCode = await generateFlowchartWithRetry(pdfKey);
        
        // Cache successful flowchart for future use
        sessionStorage.setItem(`cachedFlowchart_${pdfKey || 'default'}`, flowchartCode);
      } catch (genError) {
        console.error("Failed to generate flowchart:", genError);
        
        // Check for rate limit error specifically
        if (genError instanceof Error && genError.message.includes('429')) {
          const errorMessage = "Rate limit exceeded. The Gemini API free tier has a limit on requests per minute.";
          
          // Check if we have a cached version
          const cachedFlowchart = sessionStorage.getItem(`cachedFlowchart_${pdfKey || 'default'}`);
          
          if (cachedFlowchart) {
            // Use the cached version
            setCode(cachedFlowchart);
            setError(`${errorMessage} Using cached flowchart instead.`);
            toast({
              title: "API Rate Limit Reached",
              description: "Using previously generated flowchart. Please try again in a minute.",
              variant: "warning",
            });
            setIsGenerating(false);
            return;
          } else {
            // No cached version, use default
            setError(`${errorMessage} Using default flowchart instead.`);
            setCode(defaultFlowchart);
            toast({
              title: "API Rate Limit Reached",
              description: "Using default flowchart. Please try again in a minute.",
              variant: "destructive",
            });
            setIsGenerating(false);
            return;
          }
        }
        
        // Handle other errors
        let errorDesc = "Failed to generate flowchart from PDF content.";
        let errorMessage = genError instanceof Error ? genError.message : String(genError);
        
        if (errorMessage.includes("quota")) {
          errorDesc = "Failed to generate flowchart from Gemini. Quota exceeded or API unavailable.";
        } else if (errorMessage.includes("dynamically imported module") || 
                  errorMessage.includes("Failed to fetch")) {
          errorDesc = "Failed to load flowchart rendering modules. This might be due to network issues.";
          errorMessage = "Module loading error: " + errorMessage;
        } else if (errorMessage.includes("No PDF content available")) {
          errorDesc = "No PDF content available. Please upload a PDF document first.";
          errorMessage = "Missing PDF content: " + errorMessage;
        }
        
        setCode(defaultFlowchart);
        setError(`Generation failed: ${errorMessage}`);
        
        toast({
          title: "Generation Failed",
          description: errorDesc + " Using default template.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      // Check if the flowchart code is valid
      try {
        // Simple syntax check without rendering
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Flowchart Generated",
          description: "A flowchart has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        
        // Check for module loading errors
        if (parseError instanceof Error && 
           (parseError.message.includes('dynamically imported module') || 
            parseError.message.includes('Failed to fetch'))) {
          
          setError(`Module loading error: The browser had trouble loading the flowchart rendering components. This might be due to network issues or ad blockers.`);
          // Still set the code for the fallback renderer to use
          setCode(cleanedCode);
          
          toast({
            title: "Rendering Issue",
            description: "Using simplified flowchart due to module loading issues.",
            variant: "warning",
          });
        } else {
          // Other syntax errors
          setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          setCode(defaultFlowchart);
          
          toast({
            title: "Syntax Error",
            description: "The generated flowchart had syntax errors. Using a default template instead.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to generate flowchart:", err);
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Using default template.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
