
import React, { useEffect, useRef } from 'react';
import MindElixir from 'mind-elixir';
import nodeMenu from '@mind-elixir/node-menu-neo';
import { useToast } from '@/hooks/use-toast';
import '../styles/node-menu.css';

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady: (instance: any) => void;
  onExplainText?: (text: string) => void;
}

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Check for existing mind map data
      let mindMapData;
      try {
        const storedData = sessionStorage.getItem('mindMapData');
        mindMapData = storedData ? JSON.parse(storedData) : null;
      } catch (e) {
        console.error('Error parsing stored mind map data:', e);
        mindMapData = null;
      }

      // Fallback data if no stored data is found
      const defaultData = {
        nodeData: {
          id: 'root',
          topic: 'Mind Map',
          children: [
            { id: '1', topic: 'Loading data...' }
          ]
        }
      };

      // Initialize mind-elixir
      const options = {
        el: containerRef.current,
        direction: 'right',
        data: mindMapData || defaultData,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true,
        locale: 'en',
        contextMenuOption: {
          focus: true,
          extend: [
            {
              name: 'Explain Topic',
              onclick: (node: any) => {
                if (onExplainText && node.topic) {
                  onExplainText(`Please explain: ${node.topic}`);
                }
              }
            }
          ]
        }
      };

      // Create mind map instance
      const mindElixirInstance = new MindElixir(options);
      mindElixirInstance.init();

      // Add the node menu plugin
      nodeMenu(mindElixirInstance);

      // Register events
      mindElixirInstance.on('operation', (data: any) => {
        // Save data to session storage when operations occur
        try {
          const currentData = mindElixirInstance.getData();
          sessionStorage.setItem('mindMapData', JSON.stringify(currentData));
        } catch (error) {
          console.error('Error saving mind map data:', error);
        }
      });

      // Store the reference and notify parent
      mindMapRef.current = mindElixirInstance;
      if (onMindMapReady) {
        onMindMapReady(mindElixirInstance);
      }

      // Clean up
      return () => {
        try {
          if (mindMapRef.current) {
            mindMapRef.current.removeFromDom();
          }
        } catch (e) {
          console.error('Error removing mind map:', e);
        }
      };
    } catch (error) {
      console.error('Error initializing mind map:', error);
      toast({
        title: 'Mind Map Error',
        description: 'Failed to initialize the mind map.',
        variant: 'destructive'
      });
    }
  }, [onMindMapReady, onExplainText, toast]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div 
        ref={containerRef} 
        className="w-full h-full overflow-hidden"
      />
    </div>
  );
};

export default MindMapViewer;
