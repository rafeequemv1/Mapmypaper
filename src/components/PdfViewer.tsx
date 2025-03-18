
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ open, onOpenChange }) => {
  // Get PDF file from sessionStorage
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the PDF file from sessionStorage
    try {
      const fileData = sessionStorage.getItem('uploadedPdfData');
      
      if (fileData) {
        // Convert the base64 data back to a Blob
        const byteCharacters = atob(fileData.split(',')[1]);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('Error loading PDF from sessionStorage:', error);
    }
  }, []);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!pdfUrl) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="fixed left-0 top-[61px] bottom-0 z-20">
      <CollapsibleContent className="w-[400px] h-full bg-background border-r p-0 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="h-full flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-medium">PDF Preview</h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              className="w-full h-full"
              title="PDF Preview"
            />
          </div>
        </div>
      </CollapsibleContent>
      
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`absolute top-4 ${open ? 'left-[400px]' : 'left-0'} -mr-3 h-8 w-8 rounded-full border p-0 shadow-md`}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
};

export default PdfViewer;
