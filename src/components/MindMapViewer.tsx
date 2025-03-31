
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

// Helper function to format node text with line breaks and add emojis
const formatNodeText = (text: string, wordsPerLine: number = 3): string => {
  if (!text) return '';
  
  // Add emoji based on topic content
  const addEmoji = (topic: string) => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('start') || topicLower.includes('begin')) return '🚀 ' + topic;
    if (topicLower.includes('organization') || topicLower.includes('structure')) return '📊 ' + topic;
    if (topicLower.includes('learn') || topicLower.includes('study')) return '📚 ' + topic;
    if (topicLower.includes('habit')) return '⏰ ' + topic;
    if (topicLower.includes('goal')) return '🎯 ' + topic;
    if (topicLower.includes('motivation')) return '💪 ' + topic;
    if (topicLower.includes('review') || topicLower.includes('summary')) return '✅ ' + topic;
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
    return topic; // No emoji match
  };
  
  // Add emoji to the text
  text = addEmoji(text);
  
  // Apply line breaks
  const words = text.split(' ');
  if (words.length <= wordsPerLine) return text;
  
  let result = '';
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine).join(' ');
    result += chunk + (i + wordsPerLine < words.length ? '\n' : '');
  }
  
  return result;
};

// Generate a color from a string (for consistent node colors based on content)
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Define a palette of vibrant colors
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD', 
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', 
    '#4DB6AC', '#81C784', '#AED581', '#DCE775', 
    '#FFF176', '#FFD54F', '#FFB74D', '#FF8A65'
  ];
  
  // Use the hash to select a color from palette
  return colors[Math.abs(hash) % colors.length];
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

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
          background: '#F9F7FF',
          color: '#8B5CF6',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level and content
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get node topic and use it to generate consistent color
          const topic = node.topic || '';
          const baseColor = stringToColor(topic);
          
          // Lighten color for background
          const lightenColor = (color: string, percent: number) => {
            const num = parseInt(color.slice(1), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return `#${(1 << 24 | (R < 255 ? R < 1 ? 0 : R : 255) << 16 | (G < 255 ? G < 1 ? 0 : G : 255) << 8 | (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
          };
          
          const bgColor = lightenColor(baseColor, 80);
          
          // Apply custom styling to nodes for a more elegant and colorful look
          tpc.style.backgroundColor = level === 0 ? '#E5DEFF' : bgColor;
          tpc.style.color = level === 0 ? '#8B5CF6' : baseColor.replace('#', '').substring(0, 6);
          tpc.style.border = `2px solid ${level === 0 ? '#8B5CF6' : baseColor}`;
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
          
          // Apply line breaks and emojis to node topics
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
              topic: '🧠 Mind\nMapping',
              children: [
                {
                  id: 'bd1',
                  topic: '📊 Organization',
                  direction: 0 as const,
                  children: [
                    { id: 'bd1-1', topic: '📝 Plan' },
                    { id: 'bd1-2', topic: '📚 Study' },
                    { id: 'bd1-3', topic: '⚙️ System' },
                    { id: 'bd1-4', topic: '☕ Breaks' }
                  ]
                },
                {
                  id: 'bd2',
                  topic: '🎓 Learning\nStyle',
                  direction: 0 as const,
                  children: [
                    { id: 'bd2-1', topic: '📖 Read' },
                    { id: 'bd2-2', topic: '👂 Listen' },
                    { id: 'bd2-3', topic: '✏️ Summarize' }
                  ]
                },
                {
                  id: 'bd3',
                  topic: '⏰ Habits',
                  direction: 0 as const,
                  children: []
                },
                {
                  id: 'bd4',
                  topic: '🎯 Goals',
                  direction: 1 as const,
                  children: [
                    { id: 'bd4-1', topic: '🔍 Research' },
                    { id: 'bd4-2', topic: '🎤 Lecture' },
                    { id: 'bd4-3', topic: '📝 Conclusions' }
                  ]
                },
                {
                  id: 'bd5',
                  topic: '💪 Motivation',
                  direction: 1 as const,
                  children: [
                    { id: 'bd5-1', topic: '💡 Tips' },
                    { id: 'bd5-2', topic: '🗺️ Roadmap' }
                  ]
                },
                {
                  id: 'bd6',
                  topic: '✅ Review',
                  direction: 1 as const,
                  children: [
                    { id: 'bd6-1', topic: '📔 Notes' },
                    { id: 'bd6-2', topic: '🔄 Method' },
                    { id: 'bd6-3', topic: '💬 Discuss' }
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
            topic: '⚠️ Error\nLoading\nMind Map',
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
        linkElement.setAttribute('stroke', '#8B5CF6');
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
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ 
            background: `linear-gradient(90deg, #F9F7FF 0%, #E5DEFF 100%)`,
            transition: 'background-color 0.5s ease'
          }}
        />
      </div>
    </div>
  );
};

export default MindMapViewer;
