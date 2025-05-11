
import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw, FileText, Code, Users, FileCode, Settings, ExternalLink, BookOpen, BarChart2, Database, Layers, Zap } from "lucide-react";
import ReactDOMServer from 'react-dom/server';
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
import "../../styles/node-menu.css";

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MindmapModal({ isOpen, onClose }: MindmapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  
  // Enhanced detailed mindmap data structure
  const detailedMindmapData = {
    nodeData: {
      id: 'root',
      topic: 'Software Documentation',
      children: [
        { 
          id: '1', 
          topic: 'Written text or illustration', 
          direction: 0,
          style: { background: '#D3E4FD', color: '#0E63B3' },
          children: [
            { 
              id: '1-1', 
              topic: 'Explains software operation or usage',
              style: { background: '#FEF7CD', color: '#8B6E00' }
            }
          ]
        },
        { 
          id: '2', 
          topic: 'Different meanings for different roles', 
          direction: 0,
          style: { background: '#D3E4FD', color: '#0E63B3' } 
        },
        { 
          id: '3', 
          topic: 'Accompanies software or embedded in source code', 
          direction: 0,
          style: { background: '#D3E4FD', color: '#0E63B3' } 
        },
        { 
          id: '4', 
          topic: 'Important part of software engineering', 
          direction: 0,
          style: { background: '#F2FCE2', color: '#3D7A0F' }
        },
        { 
          id: '5', 
          topic: 'Types of Documentation', 
          direction: 1,
          style: { background: '#E5DEFF', color: '#5E3BCE' },
          children: [
            { 
              id: '5-1', 
              topic: 'Requirements', 
              style: { background: '#E5DEFF', color: '#5E3BCE' },
              children: [
                { 
                  id: '5-1-1', 
                  topic: 'Identify attributes, capacities, characteristics',
                  style: { background: '#FFDEE2', color: '#B52D41' }
                }
              ]
            },
            { 
              id: '5-2', 
              topic: 'Architecture/Design', 
              style: { background: '#E5DEFF', color: '#5E3BCE' },
              children: [
                { 
                  id: '5-2-1', 
                  topic: 'Overview of software',
                  style: { background: '#FFDEE2', color: '#B52D41' }
                },
                { 
                  id: '5-2-2', 
                  topic: 'Constructive principles for components',
                  style: { background: '#FFDEE2', color: '#B52D41' }
                }
              ]
            },
            { 
              id: '5-3', 
              topic: 'Technical', 
              style: { background: '#E5DEFF', color: '#5E3BCE' },
              children: [
                { 
                  id: '5-3-1', 
                  topic: 'API reference',
                  style: { background: '#FFDEE2', color: '#B52D41' }
                },
                { 
                  id: '5-3-2', 
                  topic: 'Code documentation',
                  style: { background: '#FFDEE2', color: '#B52D41' }
                }
              ]
            },
            { 
              id: '5-4', 
              topic: 'End User', 
              style: { background: '#E5DEFF', color: '#5E3BCE' },
              children: [
                { 
                  id: '5-4-1', 
                  topic: 'Manuals for:',
                  style: { background: '#FFDEE2', color: '#B52D41' },
                  children: [
                    { 
                      id: '5-4-1-1', 
                      topic: 'End users',
                      style: { background: '#FDE1D3', color: '#A94C0F' } 
                    },
                    { 
                      id: '5-4-1-2', 
                      topic: 'System administrators',
                      style: { background: '#FDE1D3', color: '#A94C0F' } 
                    },
                    { 
                      id: '5-4-1-3', 
                      topic: 'Support staff',
                      style: { background: '#FDE1D3', color: '#A94C0F' } 
                    }
                  ]
                }
              ]
            },
            { 
              id: '5-5', 
              topic: 'Marketing', 
              style: { background: '#E5DEFF', color: '#5E3BCE' },
              children: [
                { 
                  id: '5-5-1', 
                  topic: 'How to market the product',
                  style: { background: '#FFDEE2', color: '#B52D41' } 
                },
                { 
                  id: '5-5-2', 
                  topic: 'Analysis of market demand',
                  style: { background: '#FFDEE2', color: '#B52D41' } 
                }
              ]
            }
          ]
        }
      ]
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
          
          // Setup the mindmap for visualization with enhanced options
          const options = {
            el: containerRef.current,
            direction: 2 as const, // 2 means both sides (left and right)
            draggable: true,
            editable: true,
            contextMenu: true,
            nodeMenu: true,
            keypress: true,
            tools: {
              zoom: true,
              create: true,
              edit: true,
              layout: true
            },
            theme: {
              name: 'Vivid Theme',
              background: '#F9F7FF',
              color: '#8B5CF6',
              palette: [
                '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9',
                '#22C55E', '#EAB308', '#EC4899', '#F43F5E'
              ],
              // Add the required cssVar property
              cssVar: {
                '--main-color': '#8B5CF6',
                '--main-bgcolor': '#F9F7FF',
                '--color1': '#8B5CF6',
                '--color2': '#D946EF',
                '--color3': '#F97316',
                '--color4': '#0EA5E9',
                '--color5': '#22C55E',
                '--color6': '#EAB308',
                '--color7': '#EC4899',
                '--color8': '#F43F5E'
              }
            }
          };
          
          // Try to create the mindmap with proper node menu integration
          try {
            const mind = new MindElixir(options);
            
            // Properly install the node menu plugin
            mind.install(nodeMenu);
            
            // Initialize with more detailed data
            mind.init(detailedMindmapData);

            // Add custom styles and icons to nodes after initialization
            setTimeout(() => {
              try {
                // Add icons to specific nodes based on their content
                const rootNode = document.querySelector('.root');
                if (rootNode) {
                  const iconContainer = document.createElement('span');
                  iconContainer.className = 'mindmap-icon';
                  iconContainer.innerHTML = renderIcon(BookOpen);
                  rootNode.querySelector('.content')?.prepend(iconContainer);
                }

                // Find and add icons to specific topic nodes
                const allNodes = document.querySelectorAll('.map-node:not(.root)');
                allNodes.forEach((node: Element) => {
                  const content = node.querySelector('.content')?.textContent?.toLowerCase() || '';
                  let iconType = null;

                  if (content.includes('architecture') || content.includes('design')) {
                    iconType = Layers;
                  } else if (content.includes('code') || content.includes('api')) {
                    iconType = Code;
                  } else if (content.includes('user') || content.includes('end user')) {
                    iconType = Users;
                  } else if (content.includes('market') || content.includes('analysis')) {
                    iconType = BarChart2;
                  } else if (content.includes('technical') || content.includes('document')) {
                    iconType = FileText;
                  } else if (content.includes('requirements')) {
                    iconType = FileCode;
                  } else if (content.includes('system') || content.includes('admin')) {
                    iconType = Settings;
                  } else if (content.includes('support')) {
                    iconType = Zap;
                  } else if (content.includes('data') || content.includes('database')) {
                    iconType = Database;
                  }

                  if (iconType) {
                    const iconContainer = document.createElement('span');
                    iconContainer.className = 'mindmap-icon';
                    iconContainer.innerHTML = renderIcon(iconType);
                    node.querySelector('.content')?.prepend(iconContainer);
                  }
                });

                // Add styles for icons
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                  .mindmap-icon {
                    display: inline-flex;
                    margin-right: 5px;
                    vertical-align: middle;
                  }
                  .mindmap-icon svg {
                    width: 16px;
                    height: 16px;
                  }
                  .root .mindmap-icon svg {
                    width: 20px;
                    height: 20px;
                  }
                `;
                document.head.appendChild(styleEl);

              } catch (iconErr) {
                console.error("Error adding icons to mindmap:", iconErr);
              }
            }, 500); // Short delay to ensure nodes are rendered

            // Store reference for later use
            mindMapRef.current = mind;
          } catch (err) {
            console.error("Error initializing mind-elixir:", err);
            
            // Fallback to static visualization
            containerRef.current.innerHTML = `
              <div class="p-4 bg-white rounded-md">
                <div class="text-center mb-4">
                  <h3 class="text-lg font-bold">Simple Mindmap Visualization</h3>
                </div>
                <div class="flex justify-center">
                  <svg width="600" height="400" viewBox="0 0 600 400">
                    <!-- Root node -->
                    <circle cx="300" cy="200" r="35" fill="#E5DEFF" stroke="#8B5CF6" stroke-width="2"/>
                    <text x="300" y="205" text-anchor="middle" font-size="12">Software Documentation</text>
                    
                    <!-- Left side branches -->
                    <line x1="300" y1="165" x2="150" y2="100" stroke="#8B5CF6" stroke-width="2"/>
                    <rect x="50" y="80" width="200" height="40" rx="8" fill="#D3E4FD" stroke="#0E63B3"/>
                    <text x="150" y="105" text-anchor="middle" font-size="10">Written text or illustration</text>
                    
                    <line x1="300" y1="190" x2="150" y2="160" stroke="#8B5CF6" stroke-width="2"/>
                    <rect x="50" y="140" width="200" height="40" rx="8" fill="#D3E4FD" stroke="#0E63B3"/>
                    <text x="150" y="165" text-anchor="middle" font-size="10">Different meanings for different roles</text>
                    
                    <line x1="300" y1="215" x2="150" y2="220" stroke="#8B5CF6" stroke-width="2"/>
                    <rect x="50" y="200" width="200" height="40" rx="8" fill="#D3E4FD" stroke="#0E63B3"/>
                    <text x="150" y="225" text-anchor="middle" font-size="10">Accompanies software or embedded in code</text>
                    
                    <line x1="300" y1="235" x2="150" y2="280" stroke="#8B5CF6" stroke-width="2"/>
                    <rect x="50" y="260" width="200" height="40" rx="8" fill="#F2FCE2" stroke="#3D7A0F"/>
                    <text x="150" y="285" text-anchor="middle" font-size="10">Important part of software engineering</text>
                    
                    <!-- Right side branch -->
                    <line x1="335" y1="200" x2="450" y2="200" stroke="#8B5CF6" stroke-width="2"/>
                    <rect x="450" y="180" width="120" height="40" rx="8" fill="#E5DEFF" stroke="#5E3BCE"/>
                    <text x="510" y="205" text-anchor="middle" font-size="10">Types of Documentation</text>
                    
                    <!-- Type branches -->
                    <line x1="510" y1="180" x2="510" y2="140" stroke="#5E3BCE" stroke-width="1.5"/>
                    <rect x="470" y="100" width="80" height="40" rx="8" fill="#E5DEFF" stroke="#5E3BCE"/>
                    <text x="510" y="125" text-anchor="middle" font-size="10">Requirements</text>
                    
                    <line x1="510" y1="220" x2="450" y2="260" stroke="#5E3BCE" stroke-width="1.5"/>
                    <rect x="410" y="240" width="80" height="40" rx="8" fill="#E5DEFF" stroke="#5E3BCE"/>
                    <text x="450" y="265" text-anchor="middle" font-size="10">Technical</text>
                    
                    <line x1="510" y1="220" x2="510" y2="260" stroke="#5E3BCE" stroke-width="1.5"/>
                    <rect x="470" y="240" width="80" height="40" rx="8" fill="#E5DEFF" stroke="#5E3BCE"/>
                    <text x="510" y="265" text-anchor="middle" font-size="10">End User</text>
                    
                    <line x1="510" y1="220" x2="570" y2="260" stroke="#5E3BCE" stroke-width="1.5"/>
                    <rect x="530" y="240" width="80" height="40" rx="8" fill="#E5DEFF" stroke="#5E3BCE"/>
                    <text x="570" y="265" text-anchor="middle" font-size="10">Marketing</text>
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
  }, [isOpen, theme]);

  // Helper function to render icon SVG from Lucide components
  const renderIcon = (IconComponent: typeof FileText) => {
    const tempContainer = document.createElement('div');
    const icon = React.createElement(IconComponent, { size: 16 });
    const iconString = ReactDOMServer.renderToStaticMarkup(icon);
    tempContainer.innerHTML = iconString;
    return tempContainer.innerHTML;
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Interactive Software Documentation Mindmap</DialogTitle>
          <DialogDescription>
            A detailed visualization of software documentation concepts with icons
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4">
          <div 
            className="mindmap-container w-full min-h-[400px] max-h-[60vh] flex items-center justify-center bg-white rounded-md border overflow-auto"
          >
            {isRendering && (
              <div className="text-gray-500 flex flex-col items-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                <div>Loading enhanced mindmap...</div>
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
{`mindmap
  root("Software Documentation")
    Written text or illustration
      Explains software operation or usage
    Different meanings for different roles
    Accompanies software or embedded in source code
    Important part of software engineering
    Types of Documentation
      Requirements
        Identify attributes, capacities, characteristics
      Architecture/Design
        Overview of software
        Constructive principles for components
      Technical
        API reference
        Code documentation
      End User
        Manuals for
          End users
          System administrators
          Support staff
      Marketing
        How to market the product
        Analysis of market demand`}
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

