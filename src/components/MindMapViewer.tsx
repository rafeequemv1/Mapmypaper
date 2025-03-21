
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import MindMapContextMenu from "./mindmap/MindMapContextMenu";

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

// Get node colors based on node level
const getNodeColors = (level: number) => {
  return {
    backgroundColor: level === 0 ? '#CFFAFE' : '#F2FCE2',
    borderColor: level === 0 ? '#06B6D4' : '#67c23a',
    textColor: '#333333' // Dark text for better readability across all themes
  };
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { toast } = useToast();

  // Handle AI expansion of a node
  const handleAIExpand = async () => {
    if (!selectedNode || !onExplainText) return;
    
    const nodeTopic = selectedNode.nodeObj.topic;
    
    // Generate a unique timestamp to ensure image is always treated as new
    const timestamp = Date.now();
    sessionStorage.setItem('selectedImageForChat', ''); // Clear any previous image
    
    // Send to chat for expansion with a unique identifier to force new processing
    onExplainText(`Please expand on this mind map node: "${nodeTopic}" [EXPAND_NODE_${timestamp}]`);
    
    if (onRequestOpenChat) {
      onRequestOpenChat();
    }
    
    toast({
      title: "AI Expansion Requested",
      description: `Expanding node: "${nodeTopic}"`,
      duration: 3000,
    });
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
          name: 'colorful',
          background: '#F0F7FF',
          color: '#06B6D4',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get appropriate colors based on node level
          const { backgroundColor, borderColor, textColor } = getNodeColors(level);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = backgroundColor;
          tpc.style.color = textColor;
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
      
      // Set up custom context menu
      mind.bus.addListener('selectNode', (nodeObj: any, clickEvent: any) => {
        // Store the selected node for context menu actions
        setSelectedNode({ nodeObj, clickEvent });
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

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full overflow-hidden relative">
        <MindMapContextMenu
          onCopy={() => {
            if (selectedNode) {
              navigator.clipboard.writeText(selectedNode.nodeObj.topic);
              toast({
                title: "Copied to clipboard",
                description: `Node text "${selectedNode.nodeObj.topic}" copied`,
                duration: 2000,
              });
            }
          }}
          onDelete={() => {
            if (selectedNode && mindMapRef.current) {
              mindMapRef.current.removeNode(selectedNode.nodeObj);
              toast({
                title: "Node Deleted",
                description: "The selected node has been removed",
                duration: 2000,
              });
            }
          }}
          onAddChild={() => {
            if (selectedNode && mindMapRef.current) {
              // Fix TypeScript error by creating a proper NodeObj
              // Instead of passing a string directly, we pass it to the addChild method
              mindMapRef.current.addChild(selectedNode.nodeObj, { topic: "New Node" });
              toast({
                title: "Child Added",
                description: "A new child node has been added",
                duration: 2000,
              });
            }
          }}
          onAddSibling={() => {
            if (selectedNode && mindMapRef.current) {
              // Fix TypeScript error by passing a topic object instead of a string
              // The insertSibling method expects a Topic object not a string
              mindMapRef.current.insertSibling(selectedNode.nodeObj, { topic: "New Sibling" });
              toast({
                title: "Sibling Added",
                description: "A new sibling node has been added",
                duration: 2000,
              });
            }
          }}
          onAIExpand={handleAIExpand}
        >
          <div 
            ref={containerRef} 
            className="w-full h-full" 
            style={{ 
              background: `linear-gradient(90deg, #F9F7F3 0%, #F2FCE2 100%)`,
            }}
          />
        </MindMapContextMenu>
      </div>
    </div>
  );
};

export default MindMapViewer;
