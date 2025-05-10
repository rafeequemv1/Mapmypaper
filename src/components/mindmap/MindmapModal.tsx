
import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MindElixir, { MindElixirInstance } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import { getCachedDiagram, cacheDiagram } from "@/utils/diagramCache";
import "../../styles/node-menu.css";

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfKey?: string; // Add pdfKey prop to enable caching
}

export function MindmapModal({ isOpen, onClose, pdfKey }: MindmapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  
  // Demo mindmap code - this will be used when there's no cached data
  const defaultMindmapCode = `mindmap
  root((Mindmap))
    Origins
      Long history
      Popularization
        British psychology author Tony Buzan
    Research
      On effectiveness
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`;

  // Convert mindmap code to MindElixir data structure
  const convertCodeToMindElixirData = (code: string) => {
    try {
      // Check if the code is in JSON format
      if (code.trim().startsWith('{')) {
        try {
          // Try to parse as JSON directly
          return JSON.parse(code);
        } catch (jsonError) {
          console.error("Error parsing JSON mindmap data:", jsonError);
        }
      }
      
      // If not JSON or JSON parsing failed, process as Mermaid syntax
      const lines = code.split('\n');
      const rootLine = lines.find(line => line.includes('root(('));
      
      const rootTopic = rootLine 
        ? rootLine.match(/root\(\((.*?)\)\)/)?.[1] || 'Mindmap'
        : 'Mindmap';
      
      const data = {
        nodeData: {
          id: 'root',
          topic: rootTopic,
          children: []
        }
      };
      
      // Track the current parent at each indent level
      const parents: any[] = [data.nodeData];
      const indentLevels: number[] = [0];
      
      let lastId = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('mindmap') || line.includes('root((')) continue;
        
        // Calculate indent level based on spaces
        let indentLevel = 0;
        for (let j = 0; j < lines[i].length; j++) {
          if (lines[i][j] === ' ') indentLevel++;
          else break;
        }
        indentLevel = Math.floor(indentLevel / 2);
        
        // Create a new node
        const node = {
          id: `${++lastId}`,
          topic: line.trim(),
          children: []
        };
        
        // Find appropriate parent for this indent level
        while (indentLevels.length > 0 && indentLevel <= indentLevels[indentLevels.length - 1]) {
          parents.pop();
          indentLevels.pop();
        }
        
        // Add to parent and update tracking arrays
        if (parents.length > 0) {
          const parent = parents[parents.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(node);
          parents.push(node);
          indentLevels.push(indentLevel);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error converting mindmap code to data structure:", error);
      // Return default structure on error
      return {
        nodeData: {
          id: 'root',
          topic: 'Mindmap',
          children: [
            { id: '1', topic: 'Error converting data', children: [] }
          ]
        }
      };
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const renderMindmap = async () => {
      try {
        setIsRendering(true);
        setError(null);
        
        if (containerRef.current) {
          // Clear any existing content to prevent DOM conflicts
          containerRef.current.innerHTML = '';
          
          // Check for cached mindmap data if pdfKey is provided
          let mindmapCode = defaultMindmapCode;
          let data;
          
          if (pdfKey) {
            const cached = getCachedDiagram(pdfKey, 'mindmap');
            if (cached) {
              mindmapCode = cached;
              console.log("Using cached mindmap data");
            }
          }
          
          // Convert the mindmap code to MindElixir data structure
          data = convertCodeToMindElixirData(mindmapCode);
          
          // Setup the mindmap for visualization
          const options = {
            el: containerRef.current,
            direction: 1 as const,
            draggable: true,
            editable: true,
            contextMenu: true,
            nodeMenu: true,
            tools: {
              zoom: true,
              create: true,
              edit: true,
              layout: true
            },
            theme: {
              name: 'Catppuccin',
              background: '#F9F7FF',
              color: '#8B5CF6',
              palette: [
                '#dd7878', '#ea76cb', '#8839ef', '#e64553', 
                '#fe640b', '#df8e1d', '#40a02b', '#209fb5'
              ],
              // Add the required cssVar property
              cssVar: {
                '--main-color': '#8B5CF6',
                '--main-bgcolor': '#F9F7FF',
                '--color1': '#dd7878',
                '--color2': '#ea76cb',
                '--color3': '#8839ef',
                '--color4': '#e64553',
                '--color5': '#fe640b',
                '--color6': '#df8e1d',
                '--color7': '#40a02b',
                '--color8': '#209fb5'
              }
            }
          };
          
          // Try to create the mindmap with proper node menu integration
          try {
            const mind = new MindElixir(options);
            
            // Properly install the node menu plugin
            mind.install(nodeMenu);
            
            // Initialize with data
            mind.init(data);
            
            // Attach change listener to save changes to cache if pdfKey is provided
            if (pdfKey) {
              mind.bus.addListener('operation', () => {
                // Save the mind map data to cache when it's modified
                const mindmapCode = `mindmap\n  root((${mind.nodeData.topic}))\n` + 
                  serializeMindElixirData(mind.nodeData.children, 2);
                cacheDiagram(pdfKey, 'mindmap', mindmapCode);
              });
            }
            
            // Store reference for later use
            mindMapRef.current = mind;
          } catch (err) {
            console.error("Error initializing mind-elixir:", err);
            
            // Fallback to the static visualization if mind-elixir fails
            containerRef.current.innerHTML = `
              <div class="p-4 bg-white rounded-md">
                <div class="text-center mb-4">
                  <h3 class="text-lg font-bold">Simple Mindmap Visualization</h3>
                </div>
                <div class="flex justify-center">
                  <svg width="500" height="300" viewBox="0 0 500 300">
                    <!-- Root node -->
                    <circle cx="250" cy="50" r="30" fill="#E5DEFF" stroke="#8B5CF6" stroke-width="2"/>
                    <text x="250" y="55" text-anchor="middle" font-size="12">Mindmap</text>
                    
                    <!-- Origin branch -->
                    <line x1="250" y1="80" x2="150" y2="120" stroke="#8B5CF6" stroke-width="2"/>
                    <circle cx="150" cy="120" r="25" fill="#D3E4FD" stroke="#0EA5E9" stroke-width="2"/>
                    <text x="150" y="125" text-anchor="middle" font-size="10">Origins</text>
                    
                    <!-- Research branch -->
                    <line x1="250" y1="80" x2="250" y2="120" stroke="#8B5CF6" stroke-width="2"/>
                    <circle cx="250" cy="120" r="25" fill="#FDE1D3" stroke="#F97316" stroke-width="2"/>
                    <text x="250" y="125" text-anchor="middle" font-size="10">Research</text>
                    
                    <!-- Tools branch -->
                    <line x1="250" y1="80" x2="350" y2="120" stroke="#8B5CF6" stroke-width="2"/>
                    <circle cx="350" cy="120" r="25" fill="#F2FCE2" stroke="#22C55E" stroke-width="2"/>
                    <text x="350" y="125" text-anchor="middle" font-size="10">Tools</text>
                    
                    <!-- Origin subitems -->
                    <line x1="150" y1="145" x2="100" y2="180" stroke="#0EA5E9" stroke-width="1.5"/>
                    <rect x="70" y="170" width="60" height="20" rx="5" fill="#D3E4FD" stroke="#0EA5E9"/>
                    <text x="100" y="185" text-anchor="middle" font-size="8">History</text>
                    
                    <line x1="150" y1="145" x2="150" y2="180" stroke="#0EA5E9" stroke-width="1.5"/>
                    <rect x="120" y="170" width="60" height="20" rx="5" fill="#D3E4FD" stroke="#0EA5E9"/>
                    <text x="150" y="185" text-anchor="middle" font-size="8">Popularization</text>
                    
                    <!-- Research subitems -->
                    <line x1="250" y1="145" x2="200" y2="180" stroke="#F97316" stroke-width="1.5"/>
                    <rect x="170" y="170" width="60" height="20" rx="5" fill="#FDE1D3" stroke="#F97316"/>
                    <text x="200" y="185" text-anchor="middle" font-size="8">Effectiveness</text>
                    
                    <line x1="250" y1="145" x2="270" y2="180" stroke="#F97316" stroke-width="1.5"/>
                    <rect x="240" y="170" width="60" height="20" rx="5" fill="#FDE1D3" stroke="#F97316"/>
                    <text x="270" y="185" text-anchor="middle" font-size="8">Creation</text>
                    
                    <!-- Tools subitems -->
                    <line x1="350" y1="145" x2="330" y2="180" stroke="#22C55E" stroke-width="1.5"/>
                    <rect x="300" y="170" width="60" height="20" rx="5" fill="#F2FCE2" stroke="#22C55E"/>
                    <text x="330" y="185" text-anchor="middle" font-size="8">Pen & Paper</text>
                    
                    <!-- Creation subitems -->
                    <line x1="270" y1="190" x2="270" y2="220" stroke="#F97316" stroke-width="1"/>
                    <rect x="240" y="220" width="60" height="20" rx="5" fill="#FDE1D3" stroke="#F97316"/>
                    <text x="270" y="235" text-anchor="middle" font-size="8">Uses</text>
                  </svg>
                </div>
              </div>
            `;
          }
        }
      } catch (err) {
        console.error("Error rendering mindmap:", err);
        setError(String(err));
      } finally {
        setIsRendering(false);
      }
    };
    
    renderMindmap();
    
    // Cleanup function to properly unmount the mindmap
    return () => {
      if (mindMapRef.current) {
        // Allow time for any animations to complete before destroying
        setTimeout(() => {
          mindMapRef.current = null;
        }, 100);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, theme, pdfKey]);

  // Helper function to serialize the mind map data back to a string format
  const serializeMindElixirData = (children: any[], indentLevel: number): string => {
    if (!children || !Array.isArray(children) || children.length === 0) return '';
    
    let result = '';
    const indent = '  '.repeat(indentLevel);
    
    for (const child of children) {
      result += `${indent}${child.topic}\n`;
      if (child.children && child.children.length > 0) {
        result += serializeMindElixirData(child.children, indentLevel + 1);
      }
    }
    
    return result;
  };

  // Toggle through available themes
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Function to manually re-render the diagram
  const reRenderDiagram = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    // Force a re-render by changing a dependency the useEffect relies on
    setTheme(prevTheme => prevTheme); // This will trigger the useEffect
  };

  // Ensure proper cleanup when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Cleanup any mindmap elements before closing
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Interactive Mindmap</DialogTitle>
          <DialogDescription>
            A visualization of mindmap concepts
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4">
          <div 
            className="mindmap-container w-full min-h-[300px] max-h-[50vh] flex items-center justify-center bg-white rounded-md border overflow-auto"
          >
            {isRendering && (
              <div className="text-gray-500 flex flex-col items-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                <div>Loading mindmap...</div>
              </div>
            )}
            
            {error && (
              <div className="p-6 text-red-500 bg-red-50 rounded-md border border-red-200">
                <p className="font-semibold mb-2">Error rendering mindmap:</p>
                <pre className="text-sm overflow-auto">{error}</pre>
              </div>
            )}
            
            <div 
              ref={containerRef} 
              className={`w-full h-full flex items-center justify-center ${isRendering ? 'hidden' : ''}`}
            />
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Mindmap Structure:</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-[15vh] overflow-y-auto">
              {defaultMindmapCode}
            </pre>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <div className="flex items-center gap-2 w-full justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Theme: {theme}
            </Button>
            <Button onClick={reRenderDiagram} disabled={isRendering}>
              {isRendering ? 'Rendering...' : 'Refresh Diagram'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
