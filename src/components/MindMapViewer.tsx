
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenuNeo from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { downloadMindMapAsSVG } from "@/lib/export-utils";

// Extend the MindElixirInstance type to include missing methods
interface ExtendedMindElixirInstance extends MindElixirInstance {
  findNodeById: (id: string) => any;
  refresh: () => void;
  scale: (scale: number) => void;
  exportSvg: (noForeignObject?: boolean, injectCss?: string) => Blob;
  exportPng: (noForeignObject?: boolean, injectCss?: string) => Promise<Blob>;
  getData: () => MindElixirData;
  nodeData: any;
}

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

// Enhanced helper function to format node text with line breaks and add emojis
const formatNodeText = (text: string, wordsPerLine: number = 4, isRoot: boolean = false): string => {
  if (!text) return '';
  
  // Use fewer words per line for root node
  const effectiveWordsPerLine = isRoot ? 3 : wordsPerLine;
  
  // For root nodes, extract just the title part (first sentence or phrase)
  let processedText = text;
  if (isRoot) {
    // Extract the title - take first sentence, or first part before a comma/semicolon
    const titleMatch = text.match(/^(?:\p{Emoji}\s*)?(.*?)(?:[.,:;]|$)/u);
    if (titleMatch && titleMatch[1]) {
      processedText = titleMatch[1].trim();
      // Add emoji if it was present
      if (/^\p{Emoji}/u.test(text)) {
        const emojiMatch = text.match(/^(\p{Emoji})/u);
        if (emojiMatch) {
          processedText = emojiMatch[1] + ' ' + processedText;
        }
      }
    }
  } else {
    // Add emoji based on topic content if one doesn't exist already
    processedText = addEmoji(text);
    // Ensure the topic text is a complete sentence
    processedText = ensureCompleteSentence(processedText);
  }
  
  // Apply line breaks for better readability - strictly limit to 4 words per line
  const words = processedText.split(' ');
  if (words.length <= effectiveWordsPerLine) return processedText;
  
  let result = '';
  for (let i = 0; i < words.length; i += effectiveWordsPerLine) {
    const chunk = words.slice(i, i + effectiveWordsPerLine).join(' ');
    result += chunk + (i + effectiveWordsPerLine < words.length ? '\n' : '');
  }
  
  return result;
};

// Add emoji based on topic content
const addEmoji = (topic: string): string => {
  // Check if the topic already starts with an emoji
  if (/^\p{Emoji}/u.test(topic)) {
    return topic; // Already has an emoji
  }
  
  const topicLower = topic.toLowerCase();
  
  // Main sections
  if (topicLower.includes('introduction')) return '🚪 ' + topic;
  if (topicLower.includes('methodology')) return '⚙️ ' + topic;
  if (topicLower.includes('results')) return '📊 ' + topic;
  if (topicLower.includes('discussion')) return '💭 ' + topic;
  if (topicLower.includes('conclusion')) return '🏁 ' + topic;
  if (topicLower.includes('references')) return '📚 ' + topic;
  if (topicLower.includes('supplementary')) return '📎 ' + topic;
  
  // Introduction subsections
  if (topicLower.includes('background') || topicLower.includes('context')) return '📘 ' + topic;
  if (topicLower.includes('motivation') || topicLower.includes('problem')) return '⚠️ ' + topic;
  if (topicLower.includes('gap')) return '🧩 ' + topic;
  if (topicLower.includes('objective') || topicLower.includes('hypothesis')) return '🎯 ' + topic;
  
  // Methodology subsections
  if (topicLower.includes('experimental') || topicLower.includes('data collection')) return '🧪 ' + topic;
  if (topicLower.includes('model') || topicLower.includes('theory') || topicLower.includes('framework')) return '🔬 ' + topic;
  if (topicLower.includes('procedure') || topicLower.includes('algorithm')) return '📋 ' + topic;
  if (topicLower.includes('variable') || topicLower.includes('parameter')) return '🔢 ' + topic;
  
  // Results subsections
  if (topicLower.includes('key finding')) return '✨ ' + topic;
  if (topicLower.includes('figure') || topicLower.includes('table') || topicLower.includes('visualization')) return '📈 ' + topic;
  if (topicLower.includes('statistical') || topicLower.includes('analysis')) return '📏 ' + topic;
  if (topicLower.includes('observation')) return '👁️ ' + topic;
  
  // Discussion subsections
  if (topicLower.includes('interpretation')) return '🔎 ' + topic;
  if (topicLower.includes('comparison') || topicLower.includes('previous work')) return '🔄 ' + topic;
  if (topicLower.includes('implication')) return '💡 ' + topic;
  if (topicLower.includes('limitation')) return '🛑 ' + topic;
  
  // Conclusion subsections
  if (topicLower.includes('summary') || topicLower.includes('contribution')) return '✅ ' + topic;
  if (topicLower.includes('future work')) return '🔮 ' + topic;
  if (topicLower.includes('final') || topicLower.includes('remark')) return '🏁 ' + topic;
  
  // References subsections
  if (topicLower.includes('key paper') || topicLower.includes('cited')) return '📄 ' + topic;
  if (topicLower.includes('dataset') || topicLower.includes('tool')) return '🛠️ ' + topic;
  
  // Generic topics
  if (topicLower.includes('start') || topicLower.includes('begin')) return '🚀 ' + topic;
  if (topicLower.includes('organization') || topicLower.includes('structure')) return '📊 ' + topic;
  if (topicLower.includes('learn') || topicLower.includes('study')) return '📚 ' + topic;
  if (topicLower.includes('habit')) return '⏰ ' + topic;
  if (topicLower.includes('goal')) return '🎯 ' + topic;
  if (topicLower.includes('motivation')) return '💪 ' + topic;
  if (topicLower.includes('review')) return '✅ ' + topic;
  if (topicLower.includes('research')) return '🔍 ' + topic;
  if (topicLower.includes('read')) return '📖 ' + topic;
  if (topicLower.includes('write') || topicLower.includes('note')) return '✏️ ' + topic;
  if (topicLower.includes('discuss') || topicLower.includes('talk')) return '💬 ' + topic;
  if (topicLower.includes('listen')) return '👂 ' + topic;
  if (topicLower.includes('present')) return '🎤 ' + topic;
  if (topicLower.includes('plan')) return '📝 ' + topic;
  if (topicLower.includes('time')) return '⏱️ ' + topic;
  if (topicLower.includes('break')) return '☕ ' + topic;
  if (topicLower.includes('focus')) return '🧠 ' + topic;
  if (topicLower.includes('idea')) return '💡 ' + topic;
  if (topicLower.includes('question')) return '❓ ' + topic;
  if (topicLower.includes('answer')) return '✓ ' + topic;
  if (topicLower.includes('problem')) return '⚠️ ' + topic;
  if (topicLower.includes('solution')) return '🔧 ' + topic;
  
  // Default emoji for unmatched topics
  return '📌 ' + topic;
};

// Ensure the topic text is a complete sentence 
const ensureCompleteSentence = (topic: string): string => {
  const trimmedTopic = topic.trim();
  // Don't modify if it's just an emoji or very short
  if (trimmedTopic.length <= 3) return trimmedTopic;
  
  // If already ends with punctuation, return as is
  if (/[.!?;:]$/.test(trimmedTopic)) return trimmedTopic;
  
  // Add a period if it looks like a sentence (starts with capital letter or has spaces)
  if (/^[A-Z]/.test(trimmedTopic) || trimmedTopic.includes(' ')) {
    return trimmedTopic + '.';
  }
  
  return trimmedTopic;
};

// Generate a color from a string (for consistent node colors based on content)
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Define the Catppuccin-inspired color palette
  const colors = [
    '#dd7878', '#ea76cb', '#8839ef', '#e64553', 
    '#fe640b', '#df8e1d', '#40a02b', '#209fb5', 
    '#1e66f5', '#7287fd', '#ea81bb', '#dd7878', 
    '#4699d9', '#fe640b', '#6dc7be', '#a5adcb',
    '#fea45c', '#40a02b', '#e64553', '#8839ef'
  ];
  
  // Use the hash to select a color from palette
  return colors[Math.abs(hash) % colors.length];
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<ExtendedMindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentDirection, setCurrentDirection] = useState<number>(1); // Default: right
  const { toast } = useToast();

  // Initialize the mind map
  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Define a enhanced colorful theme based on the Catppuccin Theme
      const colorfulTheme = {
        name: 'Catppuccin',
        type: 'light' as const,
        background: '#F9F7FF',
        color: '#8B5CF6',
        // Enhanced palette with vibrant complementary colors
        palette: [
          '#dd7878', '#ea76cb', '#8839ef', '#e64553', 
          '#fe640b', '#df8e1d', '#40a02b', '#209fb5', 
          '#1e66f5', '#7287fd', '#ea81bb', '#fea45c'
        ],
        cssVar: {
          '--main-color': '#333',
          '--main-bgcolor': '#F9F7FF',
          '--color': '#454545',
          '--bgcolor': '#f5f5f7',
          '--panel-color': '#444446',
          '--panel-bgcolor': '#ffffff',
          '--panel-border-color': '#eaeaea',
          '--selected-color': '#8B5CF6',
          '--selected-bgcolor': '#E5DEFF',
          '--line-color': '#8B5CF6',
          '--line-width': '3px',
          '--selected-line-color': '#F97316',
          '--selected-line-width': '3.5px',
          '--root-color': '#8B5CF6',
          '--root-bgcolor': '#E5DEFF',
          '--root-border-color': '#8B5CF6',
          '--box-shadow': '0 3px 10px rgba(0,0,0,0.05)',
          '--hover-box-shadow': '0 5px 15px rgba(0,0,0,0.08)',
        }
      };
      
      const options = {
        el: containerRef.current,
        direction: currentDirection as 1 | 2 | 3 | 4, // 1: right, 2: left, 3: bottom, 4: top
        draggable: true,
        editable: true,
        contextMenu: true, 
        nodeMenu: true, // Ensure node menu is enabled
        tools: {
          zoom: true,
          create: true,
          edit: true,
          layout: true, // Allow automatic layout adjustments
        },
        theme: colorfulTheme,
        autoFit: true,
        // Add custom style to nodes based on their level and content
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get branch color from palette based on branch position
          const getBranchColor = (node: any) => {
            if (!node || !node.id) return colorfulTheme.palette[0];
            
            // If it's a root node, use the root color from theme
            if (node.id === 'root') return colorfulTheme.cssVar['--root-color'];
            
            // Find branch position for consistent coloring
            const branchId = node.id.split('-')[0];
            const branchIndex = parseInt(branchId.replace(/\D/g, '')) || 0;
            
            // Get color from palette based on branch index
            return colorfulTheme.palette[branchIndex % colorfulTheme.palette.length];
          };
          
          // Determine color based on branch and node level
          const branchColor = getBranchColor(node);
          
          // Lighten color for background
          const lightenColor = (color: string, percent: number) => {
            const num = parseInt(color.slice(1), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return `#${(1 << 24 | (R < 255 ? R < 1 ? 0 : R : 255) << 16 | (G < 255 ? G < 1 ? 0 : G : 255) << 8 | (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
          };
          
          // Calculate a lighter variant for background
          const bgColor = lightenColor(branchColor, 85);
          
          // Apply colorful styling to nodes
          tpc.style.backgroundColor = level === 0 ? colorfulTheme.cssVar['--root-bgcolor'] : bgColor;
          tpc.style.color = level === 0 ? colorfulTheme.cssVar['--root-color'] : branchColor;
          tpc.style.border = `2px solid ${level === 0 ? colorfulTheme.cssVar['--root-border-color'] : branchColor}`;
          tpc.style.borderRadius = '12px';
          tpc.style.padding = '10px 16px';
          tpc.style.boxShadow = colorfulTheme.cssVar['--box-shadow'];
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '20px' : '16px';
          tpc.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
          tpc.style.lineHeight = '1.5';
          tpc.style.maxWidth = level === 0 ? '220px' : '320px'; // Limit width of nodes, especially root
          
          // Add transition for smooth color changes
          tpc.style.transition = 'all 0.3s ease';
          
          // Add tags based on node content
          const addTags = (topic: string, element: HTMLElement) => {
            const topicLower = topic.toLowerCase();
            const tags = [];
            
            if (topicLower.includes('important')) tags.push({ text: 'Important', color: '#ef4444' });
            if (topicLower.includes('review')) tags.push({ text: 'Review', color: '#f97316' });
            if (topicLower.includes('todo')) tags.push({ text: 'Todo', color: '#3b82f6' });
            if (topicLower.includes('done')) tags.push({ text: 'Done', color: '#22c55e' });
            if (topicLower.includes('chapter') || topicLower.includes('section')) tags.push({ text: 'Section', color: '#8b5cf6' });
            if (topicLower.includes('concept')) tags.push({ text: 'Concept', color: '#06b6d4' });
            
            if (tags.length > 0) {
              // Create a tag container
              const tagContainer = document.createElement('div');
              tagContainer.style.display = 'flex';
              tagContainer.style.flexWrap = 'wrap';
              tagContainer.style.gap = '4px';
              tagContainer.style.marginTop = '6px';
              
              // Add tags
              tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.textContent = tag.text;
                tagElement.style.fontSize = '10px';
                tagElement.style.fontWeight = 'bold';
                tagElement.style.padding = '2px 6px';
                tagElement.style.borderRadius = '4px';
                tagElement.style.backgroundColor = tag.color;
                tagElement.style.color = 'white';
                tagContainer.appendChild(tagElement);
              });
              
              element.appendChild(tagContainer);
            }
          };
          
          // Add tags to nodes
          addTags(node.topic || "", tpc);
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = colorfulTheme.cssVar['--hover-box-shadow'];
            tpc.style.transform = 'translateY(-2px)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = colorfulTheme.cssVar['--box-shadow'];
            tpc.style.transform = 'translateY(0)';
          });
        }
      };

      // Create mind map instance
      const mind = new MindElixir(options) as ExtendedMindElixirInstance;
      
      // Add custom styles to node-menu and style-panel elements when they appear
      const addCustomStylesToMenus = () => {
        // Style the node menu (appears when right-clicking a node)
        const nodeMenu = document.querySelector('.node-menu');
        if (nodeMenu) {
          (nodeMenu as HTMLElement).style.borderRadius = '12px';
          (nodeMenu as HTMLElement).style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
          (nodeMenu as HTMLElement).style.border = '1px solid #eaeaea';
          (nodeMenu as HTMLElement).style.fontSize = '14px';
        }
        
        // Style the edit panel (appears when editing a node)
        const stylePanel = document.querySelector('.style-panel');
        if (stylePanel) {
          (stylePanel as HTMLElement).style.borderRadius = '12px';
          (stylePanel as HTMLElement).style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
          (stylePanel as HTMLElement).style.border = '1px solid #eaeaea';
        }
      };
      
      // Initialize with default data or load from storage if available
      const storedData = sessionStorage.getItem('mindElixirData');
      let data: any = null;
      
      try {
        if (storedData) {
          data = JSON.parse(storedData);
          // If we have stored data, ensure the direction is applied
          if (data && data.direction) {
            setCurrentDirection(data.direction);
          }
        }
      } catch (error) {
        console.error('Error parsing stored mind map data:', error);
      }
      
      if (!data) {
        // Default structure with emoji if no data is available
        data = {
          nodeData: {
            id: 'root',
            topic: '📑 Paper Analysis',
            root: true,
            children: [
              {
                id: 'sub1',
                topic: '🚪 Introduction',
                children: [
                  { id: 'sub1-1', topic: '📘 Background' },
                  { id: 'sub1-2', topic: '🎯 Objectives' }
                ]
              },
              {
                id: 'sub2',
                topic: '⚙️ Methodology',
                children: [
                  { id: 'sub2-1', topic: '🧪 Approach' },
                  { id: 'sub2-2', topic: '📊 Data Collection' }
                ]
              },
              {
                id: 'sub3',
                topic: '📊 Results',
                children: [
                  { id: 'sub3-1', topic: '✨ Key Findings' },
                  { id: 'sub3-2', topic: '📏 Analysis' }
                ]
              },
              {
                id: 'sub4',
                topic: '💭 Discussion',
                children: [
                  { id: 'sub4-1', topic: '💡 Implications' },
                  { id: 'sub4-2', topic: '🛑 Limitations' }
                ]
              },
              {
                id: 'sub5',
                topic: '🏁 Conclusion',
                children: [
                  { id: 'sub5-1', topic: '✅ Summary' },
                  { id: 'sub5-2', topic: '🔮 Future Work' }
                ]
              }
            ]
          },
          direction: currentDirection
        };
      }
      
      // Initialize the mind map with data
      mind.init(data);
      
      // Register Node Menu Neo
      if (nodeMenuNeo) {
        // @ts-ignore - We know nodeMenu exists in the extended Mind Elixir implementation
        mind.nodeMenu = nodeMenuNeo;
      }
      
      // Set up event handlers
      mind.bus.addListener('operation', (operation: any) => {
        // Save data when mind map changes
        try {
          const data = mind.getData();
          // Save the current direction with the data
          const dataWithDirection = {
            ...data,
            direction: currentDirection
          };
          sessionStorage.setItem('mindElixirData', JSON.stringify(dataWithDirection));
          sessionStorage.setItem('mindMapData', JSON.stringify(dataWithDirection));
        } catch (error) {
          console.error('Error saving mind map data:', error);
        }
      });
      
      // Process nodes on click to extract text for explanation
      mind.bus.addListener('selectNode', (node: any) => {
        if (!node) return;
        
        setSelectedNodeId(node.id);
        
        // If onExplainText is provided, send the node text for explanation
        if (onExplainText && node.topic && typeof node.topic === 'string') {
          // Always trigger chat panel automatically when a node is clicked
          onExplainText(node.topic);
          if (onRequestOpenChat) {
            onRequestOpenChat(); // Open chat panel automatically
          }
        }
      });
      
      // Apply custom styles to menus after initialization
      setTimeout(addCustomStylesToMenus, 500);
      
      // Apply line breaks to nodes for better readability
      const applyLineBreaksToNodes = () => {
        if (!mind.container) return;
        
        // Observer to watch for DOM changes and apply formatting
        const observer = new MutationObserver(() => {
          // Process the root node
          const rootNodeElement = mind.container?.querySelector('.mind-elixir-root');
          if (rootNodeElement && rootNodeElement.textContent) {
            applyLineBreaksToNode(rootNodeElement, 4); // 4 words per line for root
          }
          
          // Process all topic nodes
          const topicElements = mind.container?.querySelectorAll('.mind-elixir-topic');
          if (topicElements) {
            topicElements.forEach(topicElement => {
              if (topicElement.classList.contains('mind-elixir-root')) return; // Skip root
              applyLineBreaksToNode(topicElement as HTMLElement, 4); // 4 words per line as requested
            });
          }
        });
        
        // Apply line breaks to a specific node
        const applyLineBreaksToNode = (element: Element, wordsPerLine: number) => {
          if (!(element instanceof HTMLElement) || !element.textContent) return;
          
          const text = element.textContent;
          
          // For root node, make it shorter - extract only the title part
          if (element.classList.contains('mind-elixir-root')) {
            const titleText = text.split(/[.,;:]|(\n)/)[0].trim();
            const words = titleText.split(' ');
            
            let formattedText = '';
            for (let i = 0; i < words.length; i += wordsPerLine) {
              const chunk = words.slice(i, i + wordsPerLine).join(' ');
              formattedText += chunk + (i + wordsPerLine < words.length ? '<br>' : '');
            }
            
            element.innerHTML = formattedText;
            return;
          }
          
          // Regular nodes
          const words = text.split(' ');
          
          if (words.length <= wordsPerLine) return; // No need for line breaks
          
          let formattedText = '';
          for (let i = 0; i < words.length; i += wordsPerLine) {
            const chunk = words.slice(i, i + wordsPerLine).join(' ');
            formattedText += chunk + (i + wordsPerLine < words.length ? '<br>' : '');
          }
          
          element.innerHTML = formattedText;
        };
        
        if (mind.container) {
          observer.observe(mind.container, { 
            childList: true, 
            subtree: true,
            characterData: true 
          });
        }
        
        // Initial formatting attempt
        setTimeout(() => {
          const rootNodeElement = mind.container?.querySelector('.mind-elixir-root');
          if (rootNodeElement && rootNodeElement.textContent) {
            applyLineBreaksToNode(rootNodeElement, 4);
          }
        }, 100);
      };
      
      // Call line breaks function
      applyLineBreaksToNodes();
      
      // Store the mind map instance in ref
      mindMapRef.current = mind;
      setIsReady(true);
      
      // Notify parent that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
    }
  }, [isMapGenerated, onExplainText, onMindMapReady, onRequestOpenChat, currentDirection]);

  // Handle zoom in action
  const handleZoomIn = () => {
    if (mindMapRef.current) {
      const newZoom = Math.min(zoomLevel + 0.1, 2);
      setZoomLevel(newZoom);
      mindMapRef.current.scale(newZoom);
    }
  };

  // Handle zoom out action
  const handleZoomOut = () => {
    if (mindMapRef.current) {
      const newZoom = Math.max(zoomLevel - 0.1, 0.5);
      setZoomLevel(newZoom);
      mindMapRef.current.scale(newZoom);
    }
  };

  // Handle SVG export
  const handleExportSVG = () => {
    if (mindMapRef.current) {
      try {
        downloadMindMapAsSVG(mindMapRef.current, "mindmap");
        
        toast({
          title: "Export Successful",
          description: "Mind map exported as SVG.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Export error:", error);
        toast({
          title: "Export Failed",
          description: "There was a problem exporting the mind map.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle direction change
  const changeDirection = (direction: number) => {
    if (mindMapRef.current && currentDirection !== direction) {
      setCurrentDirection(direction);
      
      // Store the current data
      const currentData = mindMapRef.current.getData();
      
      // Destroy current instance
      mindMapRef.current = null;
      
      // Update the direction in the data
      const updatedData = {
        ...currentData,
        direction: direction
      };
      
      // Store the updated data
      sessionStorage.setItem('mindElixirData', JSON.stringify(updatedData));
      
      // Force re-initialization with new direction
      setTimeout(() => {
        if (containerRef.current) {
          // Trigger the useEffect to re-initialize with new direction
          setIsReady(false);
        }
      }, 10);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 overflow-hidden">
        {/* Mind Map Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ 
            background: 'var(--main-bgcolor, #F9F7FF)',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
          }}
        ></div>
        
        {/* Floating controls inside the mindmap canvas */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Layout direction controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Button
            variant={currentDirection === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => changeDirection(1)}
            title="Right Layout"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant={currentDirection === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => changeDirection(2)}
            title="Left Layout"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={currentDirection === 3 ? "default" : "outline"}
            size="sm"
            onClick={() => changeDirection(3)}
            title="Down Layout"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant={currentDirection === 4 ? "default" : "outline"}
            size="sm"
            onClick={() => changeDirection(4)}
            title="Up Layout"
            className="bg-white w-8 h-8 p-0 flex items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
