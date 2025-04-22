
import { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useToast } from '@/hooks/use-toast';

export const Markmaper = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    try {
      setIsLoading(true);
      // Get the PDF text from session storage
      const pdfText = sessionStorage.getItem('pdfData') || '';
      
      if (!pdfText || pdfText.trim() === '') {
        toast({
          title: "No PDF data found",
          description: "Please upload a PDF document first",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const transformer = new Transformer();
      
      // Convert PDF text to markdown-like structure
      const sections = pdfText
        .split('\n\n')
        .filter(section => section.trim().length > 0)
        .map(section => `- ${section.trim()}`)
        .join('\n');
      
      const { root } = transformer.transform(sections);
      const mm = Markmap.create(svgRef.current);
      mm.setData(root);
      
      // Enable pan & zoom
      if (mm.globals) {
        mm.globals.addEventListener('zoom', () => {
          // Update the view when zooming
        });
      }
      
      setIsLoading(false);
      
      return () => {
        // Cleanup
        if (mm) {
          mm.destroy();
        }
      };
    } catch (error) {
      console.error('Error creating markmap:', error);
      toast({
        title: "Error creating mind map",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Generating mind map...</p>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
