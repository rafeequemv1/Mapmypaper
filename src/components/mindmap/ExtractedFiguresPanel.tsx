
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ImagePlus } from 'lucide-react';

interface ExtractedFiguresPanelProps {
  figures: { imageData: string; pageNumber: number }[];
  onAddToMindMap: (imageData: string) => void;
}

const ExtractedFiguresPanel = ({ figures, onAddToMindMap }: ExtractedFiguresPanelProps) => {
  if (!figures || figures.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 italic">
        No figures were extracted from the PDF.
      </div>
    );
  }

  return (
    <div className="p-2 h-full">
      <h3 className="text-sm font-medium mb-2">Extracted Figures ({figures.length})</h3>
      <Separator className="mb-2" />
      <ScrollArea className="h-[calc(100%-40px)]">
        <div className="space-y-4">
          {figures.map((figure, index) => (
            <div key={index} className="border rounded-md p-2 bg-white">
              <div className="relative">
                <img 
                  src={figure.imageData} 
                  alt={`Figure from page ${figure.pageNumber}`} 
                  className="w-full object-contain max-h-32"
                />
                <div className="absolute top-0 right-0 bg-black/50 text-white px-1 text-xs rounded-bl">
                  Page {figure.pageNumber}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => onAddToMindMap(figure.imageData)}
                >
                  <ImagePlus className="h-3 w-3 mr-1" />
                  Add to Mind Map
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExtractedFiguresPanel;
