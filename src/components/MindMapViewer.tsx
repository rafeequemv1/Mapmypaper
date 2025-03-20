
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

// Helper function to format node text with line breaks
const formatNodeText = (text: string, wordsPerLine: number = 4): string => {
  if (!text) return '';
  
  const words = text.split(' ');
  if (words.length <= wordsPerLine) return text;
  
  let result = '';
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine).join(' ');
    result += chunk + (i + wordsPerLine < words.length ? '\n' : '');
  }
  
  return result;
};

// Define a colorful, soft palette for nodes
const getNodeColors = (level: number) => {
  // Soft, elegant color palette
  const palette = [
    { bg: '#F2FCE2', border: '#67c23a' }, // Soft Green
    { bg: '#FEF7CD', border: '#E6B422' }, // Soft Yellow
    { bg: '#FDE1D3', border: '#F97316' }, // Soft Peach
    { bg: '#E5DEFF', border: '#8B5CF6' }, // Soft Purple
    { bg: '#FFDEE2', border: '#EC4899' }, // Soft Pink
    { bg: '#D3E4FD', border: '#0078D7' }, // Soft Blue
    { bg: '#F1F0FB', border: '#6B7280' }, // Soft Gray
  ];
  
  // Get color based on level, with a cycling pattern for depth
  const colorIndex = level % palette.length;
  return {
    backgroundColor: level === 0 ? '#F2FCE2' : palette[colorIndex].bg,
    borderColor: palette[colorIndex].border
  };
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle explain button click
  const handleExplain = () => {
    if (selectedText) {
      console.log("Sending mind map text to explain:", selectedText);
      
      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        console.log("Requesting to open chat panel from mind map");
        onRequestOpenChat();
      }
      
      // If onExplainText is provided, pass the selected text to parent
      if (onExplainText) {
        onExplainText(selectedText);
      }
      
      // Clear selection after sending
      setSelectedText("");
      setSelectedNodeId(null);
      
      // Also clear the browser's selection
      if (window.getSelection) {
        if (window.getSelection()?.empty) {
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {
          window.getSelection()?.removeAllRanges();
        }
      }
    }
  };

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map only once when it's generated
      
      const options = {
        el: containerRef.current,
        direction: 1 as const,
        draggable: true,
        editable: true,
        contextMenu: true, 
        tools: {
          zoom: true,
          create: true,
          edit: true,
        },
        theme: {
          name: 'elegant',
          background: '#F9F7F3',
          color: '#67c23a',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get appropriate colors based on node level
          const { backgroundColor, borderColor } = getNodeColors(level);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = backgroundColor;
          tpc.style.color = '#333333'; // Soft dark text for better readability
          tpc.style.border = `2px solid ${borderColor}`;
          tpc.style.borderRadius = '12px';
          tpc.style.padding = '10px 16px';
          tpc.style.boxShadow = '0 3px 10px rgba(0,0,0,0.05)';
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '20px' : '16px';
          tpc.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
          
          // Add transition for smooth color changes
          tpc.style.transition = 'all 0.3s ease';
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
            tpc.style.transform = 'translateY(-2px)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = '0 3px 10px rgba(0,0,0,0.05)';
            tpc.style.transform = 'translateY(0)';
          });
        }
      };

      // Create mind map instance
      const mind = new MindElixir(options);
      
      // Install the node menu plugin before init
      mind.install(nodeMenu);
      
      // Get the generated mind map data from sessionStorage or use a default structure
      let data: MindElixirData;
      
      try {
        const savedData = sessionStorage.getItem('mindMapData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Apply line breaks to node topics
          const formatNodes = (node: any) => {
            if (node.topic) {
              node.topic = formatNodeText(node.topic);
            }
            
            if (node.children && node.children.length > 0) {
              node.children.forEach(formatNodes);
            }
            
            return node;
          };
          
          // Format the root node and all children
          if (parsedData.nodeData) {
            formatNodes(parsedData.nodeData);
          }
          
          data = parsedData;
        } else {
          data = {
            nodeData: {
              id: 'root',
              topic: 'Mind\nMapping',
              children: [
                {
                  id: 'bd1',
                  topic: 'Organization',
                  direction: 0 as const,
                  children: [
                    { id: 'bd1-1', topic: 'Plan' },
                    { id: 'bd1-2', topic: 'Study' },
                    { id: 'bd1-3', topic: 'System' },
                    { id: 'bd1-4', topic: 'Breaks' }
                  ]
                },
                {
                  id: 'bd2',
                  topic: 'Learning\nStyle',
                  direction: 0 as const,
                  children: [
                    { id: 'bd2-1', topic: 'Read' },
                    { id: 'bd2-2', topic: 'Listen' },
                    { id: 'bd2-3', topic: 'Summarize' }
                  ]
                },
                {
                  id: 'bd3',
                  topic: 'Habits',
                  direction: 0 as const,
                  children: []
                },
                {
                  id: 'bd4',
                  topic: 'Goals',
                  direction: 1 as const,
                  children: [
                    { id: 'bd4-1', topic: 'Research' },
                    { id: 'bd4-2', topic: 'Lecture' },
                    { id: 'bd4-3', topic: 'Conclusions' }
                  ]
                },
                {
                  id: 'bd5',
                  topic: 'Motivation',
                  direction: 1 as const,
                  children: [
                    { id: 'bd5-1', topic: 'Tips' },
                    { id: 'bd5-2', topic: 'Roadmap' }
                  ]
                },
                {
                  id: 'bd6',
                  topic: 'Review',
                  direction: 1 as const,
                  children: [
                    { id: 'bd6-1', topic: 'Notes' },
                    { id: 'bd6-2', topic: 'Method' },
                    { id: 'bd6-3', topic: 'Discuss' }
                  ]
                }
              ]
            }
          };
        }
      } catch (error) {
        console.error("Error parsing mind map data:", error);
        data = {
          nodeData: {
            id: 'root',
            topic: 'Error\nLoading\nMind Map',
            children: [
              { id: 'error1', topic: 'There was an error loading the mind map data', direction: 0 as const }
            ]
          }
        };
      }

      // Initialize the mind map with data
      mind.init(data);
      
      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;
      
      // Setup event handlers for the node menu
      mind.bus.addListener('selectNode', (node: any) => {
        console.log('Node selected:', node);
        
        // When a node is selected, get its text for potential explanation
        if (node && node.topic) {
          setSelectedText(node.topic.replace(/\n/g, ' '));
          setSelectedNodeId(node.id);
        }
      });
      
      // Hide the explanation tooltip when clicking elsewhere
      mind.bus.addListener('unselectNode', () => {
        setSelectedText("");
        setSelectedNodeId(null);
      });
      
      // Fix: Use a type assertion that bypasses the strict type checking
      // @ts-ignore - Ignore the TypeScript error since we know 'showNodeMenu' is a valid event
      mind.bus.addListener('showNodeMenu', (node: any, e: MouseEvent) => {
        console.log('Node menu shown:', node, e);
      });
      
      // Add custom styling to connection lines
      const linkElements = containerRef.current.querySelectorAll('.fne-link');
      linkElements.forEach((link: Element) => {
        const linkElement = link as SVGElement;
        linkElement.setAttribute('stroke-width', '2.5');
        linkElement.setAttribute('stroke', '#67c23a');
      });
      
      mindMapRef.current = mind;
      
      // Notify parent component that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
      
      // Show a toast notification to inform users about right-click functionality
      toast({
        title: "Mind Map Ready",
        description: "Right-click on any node to access the node menu with options.",
        duration: 5000,
      });
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        setIsReady(true);
      }, 300);
    }
  }, [isMapGenerated, onMindMapReady, toast, onExplainText, onRequestOpenChat]);

  // This effect adds the explain button directly to each node when a node is selected
  useEffect(() => {
    if (selectedNodeId) {
      const node = document.querySelector(`[data-nodeid="${selectedNodeId}"]`);
      if (node) {
        // We'll use mutation observer to ensure our button is added after any DOM changes
        setTimeout(() => {
          // Find or create the explain button container
          let explainButtonContainer = node.querySelector('.me-explain-button');
          
          if (!explainButtonContainer) {
            explainButtonContainer = document.createElement('div');
            explainButtonContainer.className = 'me-explain-button absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 z-50';
            node.appendChild(explainButtonContainer);
            
            // Create a simple button element
            const explainButton = document.createElement('button');
            explainButton.className = 'bg-white text-primary rounded-full p-1 shadow-md hover:bg-primary hover:text-white transition-colors';
            explainButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
            explainButton.title = "Explain this concept";
            
            explainButton.addEventListener('click', (e) => {
              e.stopPropagation();
              handleExplain();
            });
            
            explainButtonContainer.appendChild(explainButton);
          }
        }, 10);
      }
    } else {
      // Remove all explain buttons when no node is selected
      document.querySelectorAll('.me-explain-button').forEach(button => {
        button.remove();
      });
    }
    
    return () => {
      // Cleanup: remove all explain buttons when component unmounts
      document.querySelectorAll('.me-explain-button').forEach(button => {
        button.remove();
      });
    };
  }, [selectedNodeId]);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ 
            background: 'linear-gradient(90deg, #F9F7F3 0%, #F2FCE2 100%)',
            transition: 'background-color 0.5s ease'
          }}
        />
        
        {/* We'll rely on the dynamically added button instead of this popover */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="sr-only">Explain Node</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to explain this concept</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default MindMapViewer;
