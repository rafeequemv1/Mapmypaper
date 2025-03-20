
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, Heart, AlertTriangle, Info, Clock, Tag, User, Folder, File } from "lucide-react";

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

// Define available icons for nodes
const nodeIcons = {
  star: Star,
  heart: Heart,
  check: Check,
  warning: AlertTriangle,
  info: Info,
  clock: Clock,
  tag: Tag,
  user: User,
  folder: Folder,
  file: File
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
  const [showIconMenu, setShowIconMenu] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to add an icon to a node
  const addIconToNode = (nodeId: string, iconName: string) => {
    if (!mindMapRef.current) return;
    
    // Use the mind map's internal method to find the node
    const allNodes = mindMapRef.current.getAllDataString();
    const parsedNodes = JSON.parse(allNodes);
    
    // Find the node in the data structure
    const findNodeInData = (data: any, targetId: string): any => {
      if (data.id === targetId) {
        return data;
      }
      
      if (data.children && data.children.length > 0) {
        for (const child of data.children) {
          const found = findNodeInData(child, targetId);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    const nodeData = findNodeInData(parsedNodes.nodeData, nodeId);
    if (!nodeData) return;
    
    // Set custom icon data on the node
    nodeData.icon = iconName;
    
    // Update the data and refresh
    mindMapRef.current.refresh();
    
    // Find the node's DOM element and update it
    const nodeEl = document.querySelector(`[data-nodeid="${nodeId}"]`);
    if (nodeEl) {
      // Refresh the node to apply the icon
      mindMapRef.current.refresh();
    }
    
    setShowIconMenu(false);
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
          tpc.style.display = 'flex';
          tpc.style.alignItems = 'center';
          tpc.style.gap = '8px';
          
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
          
          // Check if the node has an icon and add it
          if (node.data.icon) {
            const iconName = node.data.icon;
            if (nodeIcons[iconName]) {
              const IconComponent = nodeIcons[iconName];
              
              // Clear existing content
              tpc.innerHTML = '';
              
              // Create icon element
              const iconDiv = document.createElement('div');
              iconDiv.className = 'node-icon';
              iconDiv.style.display = 'flex';
              iconDiv.style.alignItems = 'center';
              iconDiv.style.justifyContent = 'center';
              
              // Render the icon using SVG
              const svgNS = "http://www.w3.org/2000/svg";
              const svg = document.createElementNS(svgNS, "svg");
              svg.setAttribute("width", "16");
              svg.setAttribute("height", "16");
              svg.setAttribute("viewBox", "0 0 24 24");
              svg.setAttribute("fill", "none");
              svg.setAttribute("stroke", textColor);
              svg.setAttribute("stroke-width", "2");
              svg.setAttribute("stroke-linecap", "round");
              svg.setAttribute("stroke-linejoin", "round");
              
              // Add the appropriate path data based on the icon
              if (iconName === 'star') {
                const path = document.createElementNS(svgNS, "polygon");
                path.setAttribute("points", "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2");
                svg.appendChild(path);
              } else if (iconName === 'heart') {
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");
                svg.appendChild(path);
              } else if (iconName === 'check') {
                const path = document.createElementNS(svgNS, "polyline");
                path.setAttribute("points", "20 6 9 17 4 12");
                svg.appendChild(path);
              } else if (iconName === 'warning') {
                const path1 = document.createElementNS(svgNS, "path");
                path1.setAttribute("d", "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z");
                const path2 = document.createElementNS(svgNS, "line");
                path2.setAttribute("x1", "12");
                path2.setAttribute("y1", "9");
                path2.setAttribute("x2", "12");
                path2.setAttribute("y2", "13");
                const path3 = document.createElementNS(svgNS, "line");
                path3.setAttribute("x1", "12");
                path3.setAttribute("y1", "17");
                path3.setAttribute("x2", "12.01");
                path3.setAttribute("y2", "17");
                svg.appendChild(path1);
                svg.appendChild(path2);
                svg.appendChild(path3);
              } else if (iconName === 'info') {
                const circle = document.createElementNS(svgNS, "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "12");
                circle.setAttribute("r", "10");
                const line1 = document.createElementNS(svgNS, "line");
                line1.setAttribute("x1", "12");
                line1.setAttribute("y1", "16");
                line1.setAttribute("x2", "12");
                line1.setAttribute("y2", "12");
                const line2 = document.createElementNS(svgNS, "line");
                line2.setAttribute("x1", "12");
                line2.setAttribute("y1", "8");
                line2.setAttribute("x2", "12.01");
                line2.setAttribute("y2", "8");
                svg.appendChild(circle);
                svg.appendChild(line1);
                svg.appendChild(line2);
              } else if (iconName === 'clock') {
                const circle = document.createElementNS(svgNS, "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "12");
                circle.setAttribute("r", "10");
                const polyline = document.createElementNS(svgNS, "polyline");
                polyline.setAttribute("points", "12 6 12 12 16 14");
                svg.appendChild(circle);
                svg.appendChild(polyline);
              } else if (iconName === 'tag') {
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z");
                const line = document.createElementNS(svgNS, "line");
                line.setAttribute("x1", "7");
                line.setAttribute("y1", "7");
                line.setAttribute("x2", "7.01");
                line.setAttribute("y2", "7");
                svg.appendChild(path);
                svg.appendChild(line);
              } else if (iconName === 'user') {
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2");
                const circle = document.createElementNS(svgNS, "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "7");
                circle.setAttribute("r", "4");
                svg.appendChild(path);
                svg.appendChild(circle);
              } else if (iconName === 'folder') {
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z");
                svg.appendChild(path);
              } else if (iconName === 'file') {
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z");
                const polyline = document.createElementNS(svgNS, "polyline");
                polyline.setAttribute("points", "14 2 14 8 20 8");
                svg.appendChild(path);
                svg.appendChild(polyline);
              }
              
              iconDiv.appendChild(svg);
              tpc.appendChild(iconDiv);
              
              // Add the text after the icon
              const textDiv = document.createElement('div');
              textDiv.innerText = node.topic;
              tpc.appendChild(textDiv);
            }
          }
        }
      };

      // Create mind map instance
      const mind = new MindElixir(options);
      
      // Install the node menu plugin before init
      mind.install(nodeMenu);
      
      // Extend the node menu with custom icon options
      // Fix: Use the plugin API correctly
      const menuPlugin = nodeMenu;
      menuPlugin.addOption('Add Icon', (node: any, evt: MouseEvent) => {
        if (node && node.id) {
          setSelectedNodeId(node.id);
          setShowIconMenu(true);
        }
      });
      
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
      
      // Add custom styling to connection lines
      const linkElements = containerRef.current.querySelectorAll('.fne-link');
      linkElements.forEach((link: Element) => {
        const linkElement = link as SVGElement;
        linkElement.setAttribute('stroke-width', '2.5');
        linkElement.setAttribute('stroke', '#67c23a');
      });
      
      mindMapRef.current = mind;
      
      // Add a custom event listener for node clicks to potentially add icons
      // Fix: Use correct event listener type
      mind.bus.addListener('selectNode', (node: any) => {
        // Optional: we could show a context menu here
        // Currently handled through the nodeMenu plugin
      });
      
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
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ 
            background: `linear-gradient(90deg, #F9F7F3 0%, #F2FCE2 100%)`,
          }}
        />
        
        {/* Icon selection menu */}
        {showIconMenu && selectedNodeId && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg z-20 border border-gray-200">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Select an Icon</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowIconMenu(false)}
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(nodeIcons).map(([name, IconComponent]) => (
                  <button
                    key={name}
                    className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                    onClick={() => addIconToNode(selectedNodeId, name)}
                    title={name}
                  >
                    <IconComponent size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapViewer;
