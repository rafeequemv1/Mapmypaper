import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

// Enhanced helper function to format node text with line breaks and add emojis
const formatNodeText = (text: string, wordsPerLine: number = 5, isRoot: boolean = false): string => {
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
  
  // Apply line breaks for better readability - strictly limit to 5 words per line
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
  if (topicLower.includes('introduction')) return '🔍 ' + topic;
  if (topicLower.includes('methodology')) return '⚙️ ' + topic;
  if (topicLower.includes('results')) return '📊 ' + topic;
  if (topicLower.includes('discussion')) return '💭 ' + topic;
  if (topicLower.includes('conclusion')) return '🎯 ' + topic;
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
  
  // Supplementary subsections
  if (topicLower.includes('additional') || topicLower.includes('experiment')) return '🧮 ' + topic;
  if (topicLower.includes('appendix') || topicLower.includes('appendices')) return '📑 ' + topic;
  if (topicLower.includes('code') || topicLower.includes('data availability')) return '💾 ' + topic;
  
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
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map only once when it's generated
      
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
        direction: 1 as const,
        draggable: true,
        editable: true,
        contextMenu: true, 
        nodeMenu: true,
        tools: {
          zoom: true,
          create: true,
          edit: true,
          layout: true,
        },
        theme: colorfulTheme,
        autoFit: true
      };

      // Add custom styles to node-menu and style-panel elements when they appear
      const observeStylePanel = () => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                  // Style panel/node menu appeared - ensure it's visible
                  if (node.classList.contains('mind-elixir-style-panel') || 
                      node.classList.contains('node-style-panel') ||
                      node.classList.contains('style-wrap') ||
                      node.classList.contains('mind-elixir-node-menu')) {
                    
                    node.style.display = 'block';
                    node.style.visibility = 'visible';
                    node.style.opacity = '1';
                    node.style.zIndex = '9999';
                    
                    // Ensure the panel stays in view
                    setTimeout(() => {
                      const rect = node.getBoundingClientRect();
                      if (rect.right > window.innerWidth) {
                        node.style.left = (window.innerWidth - rect.width - 20) + 'px';
                      }
                      if (rect.bottom > window.innerHeight) {
                        node.style.top = (window.innerHeight - rect.height - 20) + 'px';
                      }
                    }, 0);
                  }
                }
              });
            }
          });
        });
        
        // Start observing the body for any style panel additions
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        return observer;
      };
      
      // Start observing for style panels
      const styleObserver = observeStylePanel();
      
      // Create the mind map instance
      const mind = new MindElixir(options);
      
      // Install the node menu plugin with full styling support
      const customNodeMenu = nodeMenu;
      
      // Add summary option to node menu
      const originalMenus = customNodeMenu.menus;
      customNodeMenu.menus = (node: any, mindInstance: MindElixirInstance) => {
        const menus = originalMenus(node, mindInstance);
        
        // Add summary option
        menus.push({
          name: '✨ Generate Summary',
          onclick: () => {
            // Get the node and its children
            generateNodeSummary(node);
          }
        });
        
        return menus;
      };
      
      // Install the node menu
      mind.install(customNodeMenu);
      
      // Get the generated mind map data from sessionStorage or use a default structure
      let data: MindElixirData;
      
      try {
        const savedData = sessionStorage.getItem('mindMapData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Apply line breaks, emojis, and complete sentences to node topics
          const formatNodes = (node: any) => {
            if (node.topic) {
              // Special handling for root node - only keep title with 3-4 words per line
              if (node.id === 'root') {
                node.topic = formatNodeText(node.topic, 3, true);
              } else {
                node.topic = formatNodeText(node.topic);
              }
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
          // Default research paper structure with complete sentences and emojis
          data = {
            nodeData: {
              id: 'root',
              topic: '🧠 Research\nPaper Title',
              children: [
                {
                  id: 'bd1',
                  topic: '🔍 Introduction provides context and sets the stage for the research.',
                  direction: 0 as const,
                  children: [
                    { id: 'bd1-1', topic: '📘 Background establishes the essential context for understanding the research problem.' },
                    { id: 'bd1-2', topic: '⚠️ The problem statement clearly identifies the issue being addressed in this study.' },
                    { id: 'bd1-3', topic: '🧩 Research gap identifies what is missing in current understanding of the topic.' },
                    { id: 'bd1-4', topic: '🎯 This study aims to test the hypothesis that will address the identified research gap.' }
                  ]
                },
                {
                  id: 'bd2',
                  topic: '⚙️ Methodology describes how the research was conducted with appropriate rigor.',
                  direction: 0 as const,
                  children: [
                    { id: 'bd2-1', topic: '🧪 The experimental setup was carefully designed to collect reliable and valid data.' },
                    { id: 'bd2-2', topic: '🔬 Theoretical models provide the foundation for testing our research hypotheses.' },
                    { id: 'bd2-3', topic: '📋 Procedures were followed systematically to ensure reproducibility of results.' },
                    { id: 'bd2-4', topic: '🔢 Key variables were identified and measured using validated instruments and techniques.' }
                  ]
                },
                {
                  id: 'bd3',
                  topic: '📊 Results present the empirical findings without interpretation.',
                  direction: 0 as const,
                  children: [
                    { id: 'bd3-1', topic: '✨ Key findings demonstrate significant relationships between the studied variables.' },
                    { id: 'bd3-2', topic: '📈 Visual representations of data help to illustrate important patterns found in the analysis.' },
                    { id: 'bd3-3', topic: '📏 Statistical analyses confirm the significance of the observed relationships.' },
                    { id: 'bd3-4', topic: '👁️ Careful observations reveal additional patterns not initially anticipated in the design.' }
                  ]
                },
                {
                  id: 'bd4',
                  topic: '💭 Discussion explores the meaning and implications of the results.',
                  direction: 1 as const,
                  children: [
                    { id: 'bd4-1', topic: '🔎 Interpretation of results explains what the findings mean in relation to the research questions.' },
                    { id: 'bd4-2', topic: '🔄 Comparison with previous work shows how this research contributes to the field.' },
                    { id: 'bd4-3', topic: '💡 Implications suggest how these findings might impact theory and practice.' },
                    { id: 'bd4-4', topic: '🛑 Limitations acknowledge the constraints that affect the interpretation of the results.' }
                  ]
                },
                {
                  id: 'bd5',
                  topic: '🎯 Conclusion summarizes the key contributions and future directions.',
                  direction: 1 as const,
                  children: [
                    { id: 'bd5-1', topic: '✅ The summary of contributions highlights the main advancements made by this research.' },
                    { id: 'bd5-2', topic: '🔮 Future work recommendations identify promising directions for extending this research.' },
                    { id: 'bd5-3', topic: '🏁 Final remarks emphasize the broader significance of this work to the field.' }
                  ]
                },
                {
                  id: 'bd6',
                  topic: '📚 References provide a comprehensive list of sources that informed this work.',
                  direction: 1 as const,
                  children: [
                    { id: 'bd6-1', topic: '📄 Key papers cited in this work establish the theoretical foundation for the research.' },
                    { id: 'bd6-2', topic: '🛠️ Datasets and tools used in the analysis are properly documented for reproducibility.' }
                  ]
                },
                {
                  id: 'bd7',
                  topic: '📎 Supplementary materials provide additional details supporting the main text.',
                  direction: 1 as const,
                  children: [
                    { id: 'bd7-1', topic: '🧮 Additional experiments that didn\'t fit in the main text are included here.' },
                    { id: 'bd7-2', topic: '📑 Appendices contain detailed methodological information for interested readers.' },
                    { id: 'bd7-3', topic: '💾 Code and data are made available to ensure transparency and reproducibility.' }
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
              { id: 'error1', topic: 'There was an error loading the mind map data. Please try refreshing the page.', direction: 0 as const }
            ]
          }
        };
      }

      // Initialize the mind map with data
      mind.init(data);
      
      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;
      
      // Enhanced clickability for nodes with style panel support
      if (containerRef.current) {
        const topicElements = containerRef.current.querySelectorAll('.mind-elixir-topic');
        topicElements.forEach((element) => {
          element.addEventListener('click', (e) => {
            // Node is clicked - no need to call any additional methods
            if (mind.currentNode && mind.currentNode.nodeObj) {
              console.log('Node clicked:', mind.currentNode.nodeObj.topic);
              
              // Force style panel visibility after a short delay
              setTimeout(() => {
                const stylePanel = document.querySelector('.mind-elixir-style-panel, .node-style-panel, .style-wrap');
                if (stylePanel && stylePanel instanceof HTMLElement) {
                  stylePanel.style.display = 'block';
                  stylePanel.style.visibility = 'visible';
                  stylePanel.style.opacity = '1';
                }
              }, 100);
            }
          });
        });
      }
      
      // Add event listeners for node selection to ensure style panel visibility
      mind.bus.addListener('selectNode', (nodeObj: any) => {
        console.log('Node selected:', nodeObj);
        
        // Ensure style panels appear
        setTimeout(() => {
          const stylePanel = document.querySelector('.mind-elixir-style-panel, .node-style-panel, .style-wrap');
          if (stylePanel && stylePanel instanceof HTMLElement) {
            stylePanel.style.display = 'block';
            stylePanel.style.visibility = 'visible';
            stylePanel.style.opacity = '1';
          }
        }, 100);
      });
      
      // Add observer for node additions to ensure they're properly initialized
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement && node.classList.contains('mind-elixir-topic')) {
                node.addEventListener('click', () => {
                  // Node is clicked - let Mind Elixir handle it
                  if (mind.currentNode && mind.currentNode.nodeObj) {
                    console.log('New node clicked:', mind.currentNode.nodeObj.topic);
                  }
                });
              }
            });
          }
        });
      });
      
      if (containerRef.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true });
      }
      
      // Enhance connection lines with arrows and colors from theme
      const enhanceConnectionLines = () => {
        // Add arrowhead definition to SVG
        const svg = containerRef.current?.querySelector('svg');
        if (svg) {
          // Create a defs element if it doesn't exist
          let defs = svg.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);
          }
          
          // Create arrowhead marker
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
          marker.setAttribute('id', 'arrowhead');
          marker.setAttribute('viewBox', '0 0 10 10');
          marker.setAttribute('refX', '6');
          marker.setAttribute('refY', '5');
          marker.setAttribute('markerWidth', '6');
          marker.setAttribute('markerHeight', '6');
          marker.setAttribute('orient', 'auto-start-reverse');
          
          // Create arrowhead path
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
          path.setAttribute('fill', colorfulTheme.cssVar['--line-color']);
          
          // Add path to marker and marker to defs
          marker.appendChild(path);
          defs.appendChild(marker);
        }
        
        // Style all connection lines
        const linkElements = containerRef.current?.querySelectorAll('.fne-link');
        if (linkElements) {
          linkElements.forEach((link: Element) => {
            const linkElement = link as SVGElement;
            linkElement.setAttribute('stroke-width', colorfulTheme.cssVar['--line-width'].replace('px', ''));
            linkElement.setAttribute('stroke', colorfulTheme.cssVar['--line-color']);
            linkElement.setAttribute('marker-end', 'url(#arrowhead)');
          });
        }
      };
      
      // Apply enhanced connections after a short delay to ensure DOM is ready
      setTimeout(() => {
        enhanceConnectionLines();
      }, 100);
      
      mindMapRef.current = mind;
      
      // Notify parent component that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
      
      // Show a toast notification to inform users about right-click functionality
      toast({
        title: "Mind Map Ready",
        description: "Click on any node to edit it. Right-click for more options.",
        duration: 5000,
      });
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        setIsReady(true);
      }, 300);
      
      // Cleanup function
      return () => {
        styleObserver.disconnect();
        observer.disconnect();
      };
    }
  }, [isMapGenerated, onMindMapReady, toast, onExplainText, onRequestOpenChat]);

  // Function to generate summaries for nodes and their children
  const generateNodeSummary = (nodeData: any) => {
    if (!nodeData) return;
    
    // Generate a simple summary from the node hierarchy
    let summaryText = `## Summary of "${nodeData.topic}"\n\n`;
    
    // Helper function to extract node topics and build a hierarchical summary
    const extractTopics = (node: any, level: number = 0) => {
      if (!node) return '';
      
      let indent = '';
      for (let i = 0; i < level; i++) {
        indent += '  ';
      }
      
      // Get clean topic text without emojis and formatting
      let topicText = node.topic || '';
      
      // Remove emojis
      topicText = topicText.replace(/[\p{Emoji}]/gu, '').trim();
      
      // Remove line breaks
      topicText = topicText.replace(/\n/g, ' ');
      
      let result = `${indent}- ${topicText}\n`;
      
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          result += extractTopics(child, level + 1);
        }
      }
      
      return result;
    };
    
    // Count the number of nodes for statistics
    const countNodes = (node: any): number => {
      if (!node) return 0;
      
      let count = 1; // Count this node
      
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          count += countNodes(child);
        }
      }
      
      return count;
    };
    
    const hierarchySummary = extractTopics(nodeData);
    const totalNodes = countNodes(nodeData);
    
    summaryText += hierarchySummary;
    summaryText += `\n\n### Statistics\n`;
    summaryText += `- Total topics: ${totalNodes}\n`;
    summaryText += `- Depth: ${nodeData.children ? Math.max(...nodeData.children.map((c: any) => countNodes(c))) : 1}\n`;
    
    setSummary(summaryText);
    setShowSummary(true);
    
    // If there's an onExplainText callback, send the summary
    if (onExplainText) {
      onExplainText(summaryText);
    }
    
    if (onRequestOpenChat) {
      onRequestOpenChat();
    }
    
    toast({
      title: "Summary Generated",
      description: "The summary has been sent to the chat panel.",
      duration: 3000,
    });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[300px]">
      {!isMapGenerated && (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Mind Map Available</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload a document or start a chat to generate a mind map.
          </p>
        </div>
      )}
      
      {isMapGenerated && (
        <>
          <div
            ref={containerRef}
            className="w-full flex-grow relative min-h-[300px] overflow-hidden"
            style={{ 
              backgroundColor: "#F9F7FF",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              transition: "all 0.3s ease",
            }}
          ></div>
          
          {showSummary && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 text-sm max-h-[300px] overflow-auto">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Mind Map Summary</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSummary(false)}>Close</Button>
              </div>
              <div className="prose prose-sm">
                {summary.split('\n').map((line, i) => (
                  <div key={i} className="mb-1">
                    {line.startsWith('#') ? (
                      <h4 className="text-md font-bold">{line.replace(/^#+\s/, '')}</h4>
                    ) : line.startsWith('-') ? (
                      <div className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{line.replace(/^-\s/, '')}</span>
                      </div>
                    ) : (
                      <p>{line}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (onExplainText && summary) {
                      onExplainText(summary);
                    }
                    if (onRequestOpenChat) {
                      onRequestOpenChat();
                    }
                  }}
                >
                  <FileText size={16} />
                  Send to Chat
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MindMapViewer;
