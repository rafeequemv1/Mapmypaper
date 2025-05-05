import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clearPdfData } from "@/utils/pdfStorage";

interface PdfTabsProps {
  onTabChange?: (pdfKey: string) => void;
}

// Helper function to get all PDF keys from sessionStorage
export const getAllPdfs = (): string[] => {
  const pdfs: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('hasPdfData_')) {
      pdfs.push(key.replace('hasPdfData_', ''));
    }
  }
  return pdfs;
};

// Helper function to get the current PDF key
export const getPdfKey = (): string => {
  return sessionStorage.getItem('currentPdfKey') || '';
};

const PdfTabs = ({ onTabChange }: PdfTabsProps) => {
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [activePdf, setActivePdf] = useState<string>('');
  const { toast } = useToast();

  // Load PDFs on component mount
  useEffect(() => {
    const loadPdfs = () => {
      const availablePdfs = getAllPdfs();
      setPdfs(availablePdfs);
      
      // Set active PDF
      const currentPdf = sessionStorage.getItem('currentPdfKey');
      if (currentPdf && availablePdfs.includes(currentPdf)) {
        setActivePdf(currentPdf);
        if (onTabChange) {
          onTabChange(currentPdf);
        }
      } else if (availablePdfs.length > 0) {
        // If no current PDF is set but we have PDFs, set the first one as active
        setActivePdf(availablePdfs[0]);
        sessionStorage.setItem('currentPdfKey', availablePdfs[0]);
        if (onTabChange) {
          onTabChange(availablePdfs[0]);
        }
      }
    };
    
    loadPdfs();
    
    // Listen for PDF data updates
    const handlePdfDataUpdated = () => {
      loadPdfs();
    };
    
    window.addEventListener('pdfDataUpdated', handlePdfDataUpdated);
    
    return () => {
      window.removeEventListener('pdfDataUpdated', handlePdfDataUpdated);
    };
  }, [onTabChange]);

  // Update the active tab handler to emit the change event
  const handleTabClick = (pdfKey: string) => {
    setActivePdf(pdfKey);
    sessionStorage.setItem('currentPdfKey', pdfKey);
    
    // Notify parent component about the active tab change
    if (onTabChange) {
      onTabChange(pdfKey);
    }
  };

  const handleRemovePdf = async (e: React.MouseEvent, pdfKey: string) => {
    e.stopPropagation();
    
    try {
      // Remove PDF data from storage
      await clearPdfData(pdfKey);
      
      // Update state
      setPdfs(prev => prev.filter(p => p !== pdfKey));
      
      // If we removed the active PDF, select another one
      if (activePdf === pdfKey) {
        const remainingPdfs = pdfs.filter(p => p !== pdfKey);
        if (remainingPdfs.length > 0) {
          setActivePdf(remainingPdfs[0]);
          sessionStorage.setItem('currentPdfKey', remainingPdfs[0]);
          if (onTabChange) {
            onTabChange(remainingPdfs[0]);
          }
        } else {
          sessionStorage.removeItem('currentPdfKey');
        }
      }
      
      toast({
        title: "PDF removed",
        description: `Removed ${pdfKey}`,
      });
    } catch (error) {
      console.error("Error removing PDF:", error);
      toast({
        title: "Error",
        description: "Failed to remove PDF",
        variant: "destructive",
      });
    }
  };

  const handleAddPdf = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    
    // Handle file selection
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        // Dispatch custom event to handle PDF upload
        window.dispatchEvent(new CustomEvent('uploadPdf', { detail: { file } }));
      }
    };
    
    // Trigger file selection dialog
    input.click();
  };

  return (
    <div className="border-b flex items-center justify-between px-2">
      <Tabs value={activePdf} className="w-full overflow-x-auto">
        <TabsList className="h-10">
          {pdfs.map((pdf) => (
            <TabsTrigger
              key={pdf}
              value={pdf}
              onClick={() => handleTabClick(pdf)}
              className="flex items-center gap-1 px-3 h-9"
            >
              <span className="max-w-[150px] truncate">{pdf}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full opacity-50 hover:opacity-100"
                onClick={(e) => handleRemovePdf(e, pdf)}
              >
                <X className="h-3 w-3" />
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={handleAddPdf}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PdfTabs;
