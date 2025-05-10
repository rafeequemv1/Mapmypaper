
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { generateStructuredSummary } from "@/services/geminiService";
import { getCachedDiagram, cacheDiagram } from "@/utils/diagramCache";
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";
import { useToast } from "@/hooks/use-toast";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFreshGeneration, setIsFreshGeneration] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  // Add state for active PDF key
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    return metas.length > 0 ? getPdfKey(metas[0]) : null;
  });

  // Load summary when the modal is opened
  useEffect(() => {
    if (open && activePdfKey) {
      loadOrGenerateSummary();
    }
  }, [open, activePdfKey]);

  const loadOrGenerateSummary = async () => {
    if (!activePdfKey) return;

    // First check if there's a cached summary
    if (!isFreshGeneration) {
      const cached = getCachedDiagram(activePdfKey, 'summary');
      if (cached) {
        try {
          // Try parsing as JSON first
          let parsedSummary;
          
          try {
            parsedSummary = JSON.parse(cached);
          } catch (parseError) {
            // If not valid JSON, use the cached string directly
            parsedSummary = { Summary: cached };
            console.error("Error parsing cached summary:", parseError);
          }
          
          setSummary(parsedSummary);
          console.log("Retrieved summary from cache");
          return;
        } catch (error) {
          console.error("Error handling cached summary:", error);
          // If parsing fails, continue to generate a new summary
        }
      }
    }

    // If not cached or forced regeneration, generate a new one
    setIsLoading(true);
    try {
      const newSummary = await generateStructuredSummary();
      setSummary(newSummary);
      
      // Cache the summary
      cacheDiagram(activePdfKey, 'summary', JSON.stringify(newSummary));
      
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
      setSummary({
        Summary: "Could not generate a summary for this document. Please try again.",
        "Key Findings": "Error occurred during generation."
      });
    } finally {
      setIsLoading(false);
      setIsFreshGeneration(false);
    }
  };

  const handlePdfChange = (key: string) => {
    setActivePdfKey(key);
    setSummary(null); // Clear current summary
  };

  const regenerateSummary = () => {
    setIsFreshGeneration(true);
    setSummary(null);
    setTimeout(() => loadOrGenerateSummary(), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Paper Summary</span>
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateSummary}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* PDF tabs */}
        <div className="mb-4 overflow-x-auto">
          <PdfTabs
            activeKey={activePdfKey}
            onTabChange={handlePdfChange}
            onRemove={() => {}} // We don't want to allow removal from this modal
          />
        </div>

        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                {isFreshGeneration ? "Generating" : "Getting"} summary...
              </p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold text-lg mb-2 text-primary">{key}</h3>
                  {Array.isArray(value) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {value.map((item, index) => (
                        <li key={index} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  ) : typeof value === 'object' && value !== null ? (
                    <div className="space-y-2">
                      {Object.entries(value as object).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <h4 className="font-medium text-sm">{subKey}</h4>
                          <p className="text-gray-700">{String(subValue)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{String(value)}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              No summary available. Select a PDF to generate a summary.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
