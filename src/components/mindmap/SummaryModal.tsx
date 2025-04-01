
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Copy, Check } from "lucide-react";
import { generateStructuredSummary } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";

// Define the Summary type to match the structure returned by the API
interface Summary {
  Summary: string;
  "Key Findings": string;
  Objectives: string;
  Methods: string;
  Results: string;
  Conclusions: string;
  "Key Concepts": string;
}

// Default empty summary
const emptyMappedSummary: Summary = {
  Summary: "Loading...",
  "Key Findings": "Loading...",
  Objectives: "Loading...",
  Methods: "Loading...",
  Results: "Loading...",
  Conclusions: "Loading...",
  "Key Concepts": "Loading..."
};

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary>(emptyMappedSummary);
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Format content for display
  const formatContent = (content: string) => {
    if (!content) return "";
    
    // Handle bullet points (lines starting with - or *)
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return <li key={index}>{trimmedLine.substring(2)}</li>;
      }
      return <p key={index}>{line}</p>;
    });
  };

  // Generate summary when the modal is opened
  useEffect(() => {
    if (open) {
      generateSummary();
    }
  }, [open]);

  // Generate summary from PDF
  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const result = await generateStructuredSummary();
      // Cast the response to Summary type
      setSummary(result as unknown as Summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Summary Generation Failed",
        description: "Could not generate a summary from the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy section text to clipboard
  const copyToClipboard = (section: string) => {
    const text = summary[section as keyof Summary] || "";
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      toast({ title: "Copied", description: `${section} copied to clipboard` });
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  // Download summary as text file
  const downloadSummary = () => {
    try {
      let content = "";
      Object.entries(summary).forEach(([key, value]) => {
        content += `## ${key}\n\n${value}\n\n`;
      });

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "paper_summary.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Summary downloaded as text file",
      });
    } catch (error) {
      console.error("Error downloading summary:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Paper Summary</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadSummary}
                className="flex gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={generateSummary}
                disabled={isLoading}
                className="flex gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Regenerate"
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            AI-generated summary of the uploaded paper
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Generating comprehensive summary of the paper...
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full overflow-hidden"
          >
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="conclusions">Conclusions</TabsTrigger>
              <TabsTrigger value="concepts">Keywords</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto pr-2">
              {Object.entries(summary).map(([key, value]) => {
                const formattedKey = key.toLowerCase().replace(/\s+/g, '');
                let tabId;
                
                switch (formattedKey) {
                  case "summary": tabId = "summary"; break;
                  case "keyfindings": tabId = "findings"; break;
                  case "objectives": tabId = "objectives"; break;
                  case "methods": tabId = "methods"; break;
                  case "results": tabId = "results"; break;
                  case "conclusions": tabId = "conclusions"; break;
                  case "keyconcepts": tabId = "concepts"; break;
                  default: tabId = ""; break;
                }

                return (
                  <TabsContent
                    key={key}
                    value={tabId}
                    className="mt-0 h-full relative"
                  >
                    <div className="prose prose-sm max-w-none">
                      <div className="flex justify-between items-center">
                        <h3>{key}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key)}
                          className="flex gap-1"
                        >
                          {copiedSection === key ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="pl-4">
                        {value && value.includes('-') ? (
                          <ul className="list-disc pl-4">
                            {formatContent(value)}
                          </ul>
                        ) : (
                          formatContent(value)
                        )}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
