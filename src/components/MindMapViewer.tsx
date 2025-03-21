import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData, Topic } from "mind-elixir";
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

// Color palette for different node levels
const getNodeColors = (level: number, direction: number) => {
  // Root node color (center)
  if (level === 0) {
    return {
      backgroundColor: '#646FA5',
      borderColor: '#4B5580',
      textColor: '#FFFFFF'
    };
  }
  
  // Colors for different branches based on direction
  const colorSchemes = [
    // Left side branches (direction 0)
    [
      { bg: '#FF9A8B', border: '#F76F58', text: '#333333' }, // Level 1 (reddish)
      { bg: '#FF8E9E', border: '#FF5A76', text: '#333333' }, // Level 2 (pinkish)
      { bg: '#FFAAA7', border: '#FF7A76', text: '#333333' }  // Level 3+ (salmon)
    ],
    // Right side branches (direction 1)
    [
      { bg: '#A6DCF7', border: '#65B7E7', text: '#333333' }, // Level 1 (light blue)
      { bg: '#81D8D0', border: '#50B7AD', text: '#333333' }, // Level 2 (turquoise)
      { bg: '#FFC988', border: '#FFA544', text: '#333333' }  // Level 3+ (orange)
    ]
  ];
  
  // Determine which color scheme to use based on direction
  const dirIndex = direction % 2;
  const levelIndex = Math.min(level - 1, colorSchemes[dirIndex].length - 1);
  
  return {
    backgroundColor: colorSchemes[dirIndex][levelIndex].bg,
    borderColor: colorSchemes[dirIndex][levelIndex].border,
    textColor: colorSchemes[dirIndex][levelIndex].text
  };
};

// Get connection line color based on direction
const getConnectionColor = (direction: number) => {
  const colors = ['#F05E6B', '#FF9A3C', '#3D92C4', '#5BC3A4'];
  return colors[direction % colors.length];
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
          background: '#F5F5F7',
          color: '#5B5B5B',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level and direction
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get direction of the node
          const direction = node.direction || 0;
          
          // Get appropriate colors based on node level and direction
          const { backgroundColor, borderColor, textColor } = getNodeColors(level, direction);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = backgroundColor;
          tpc.style.color = textColor;
          tpc.style.border = `2px solid ${borderColor}`;
          tpc.style.borderRadius = '12px';
          tpc.style.padding = '10px 16px';
          tpc.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '20px' : '16px';
          tpc.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
          
          // Add transition for smooth color changes
          tpc.style.transition = 'all 0.3s ease';
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
            tpc.style.transform = 'translateY(-3px) scale(1.02)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            tpc.style.transform = 'translateY(0) scale(1.0)';
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
      
      // Customize connection lines based on direction
      const customizeConnections = () => {
        if (!containerRef.current) return;
        
        // Get all connection lines
        const linkElements = containerRef.current.querySelectorAll('.fne-link');
        
        linkElements.forEach((link: Element) => {
          const linkElement = link as SVGElement;
          const parent = linkElement.parentElement;
          
          if (parent) {
            // Try to determine the direction from the parent node's data
            const nodeId = parent.getAttribute('data-nodeid');
            const node = nodeId ? mind.nodeData[nodeId] : null;
            
            if (node) {
              const direction = node.direction || 0;
              const color = getConnectionColor(direction);
              
              linkElement.setAttribute('stroke', color);
              linkElement.setAttribute('stroke-width', '3');
            } else {
              // Default color if direction can't be determined
              linkElement.setAttribute('stroke', '#888');
              linkElement.setAttribute('stroke-width', '2.5');
            }
          }
        });
      };
      
      // Apply custom connection styling after initialization
      setTimeout(customizeConnections, 300);
      
      // Update connections when map changes
      mind.bus.addListener('operation', customizeConnections);
      
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
              // Create a node object with id and topic properties
              const childId = `child_${Date.now()}`;
              mindMapRef.current.addChild(selectedNode.nodeObj, { 
                id: childId, 
                topic: "New Node" 
              } as Topic); // Cast to Topic type to satisfy TypeScript
              toast({
                title: "Child Added",
                description: "A new child node has been added",
                duration: 2000,
              });
            }
          }}
          onAddSibling={() => {
            if (selectedNode && mindMapRef.current) {
              // Create a node object with id and topic properties
              const siblingId = `sibling_${Date.now()}`;
              mindMapRef.current.insertSibling(selectedNode.nodeObj, { 
                id: siblingId, 
                topic: "New Sibling" 
              } as Topic); // Cast to Topic type to satisfy TypeScript
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
              background: `linear-gradient(135deg, #F9F7F3 0%, #F0F8FF 100%)`,
            }}
          />
        </MindMapContextMenu>
      </div>
    </div>
  );
};

export default MindMapViewer;
