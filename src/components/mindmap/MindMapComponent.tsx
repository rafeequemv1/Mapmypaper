
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MindMapComponentProps {
  onMindMapReady?: (instance: any) => void;
  isMapGenerated?: boolean;
  pdfKey?: string | null;
}

const MindMapComponent: React.FC<MindMapComponentProps> = ({ 
  onMindMapReady, 
  isMapGenerated,
  pdfKey
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize mind map visualization
    if (containerRef.current && pdfKey) {
      // Get the mind map data from sessionStorage
      const mindMapData = sessionStorage.getItem(`mindMapData_${pdfKey}`);
      
      if (mindMapData) {
        try {
          // Parse the mind map data
          const parsedData = JSON.parse(mindMapData);
          
          // For now, just display a placeholder
          // In a real implementation, you would render the mind map using a library
          // such as MindElixir, react-mindmap, or a custom D3.js visualization
          
          // Simulate ready state
          if (onMindMapReady) {
            // Pass a mock instance for now
            onMindMapReady({
              data: parsedData,
              refresh: () => console.log('Mind map refreshed')
            });
          }
        } catch (error) {
          console.error('Error parsing mind map data:', error);
          toast({
            title: 'Error',
            description: 'Could not load mind map data',
            variant: 'destructive'
          });
        }
      }
    }
  }, [pdfKey, onMindMapReady, toast]);

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-gray-500">Loading mind map...</p>
          </div>
        </div>
      ) : !pdfKey ? (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">No Mind Map Available</h3>
            <p className="text-sm text-gray-500">
              Please upload a PDF and generate a mind map to visualize the document's content and structure.
            </p>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="flex-1 bg-white border-l"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <div className="text-center p-8">
            <h3 className="text-xl font-bold mb-4">Mind Map Placeholder</h3>
            <p className="text-gray-600">
              This is where your mind map visualization will appear when implemented with a mind mapping library.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              PDF Key: {pdfKey}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapComponent;
