import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText, LoaderCircle, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, ArrowDown, Images } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Enhanced helper function to format node text with line breaks and add emojis
const formatNodeText = (text: string, wordsPerLine: number = 4, isRoot: boolean = false): string => {
  if (!text) return '';

  // Use fewer words per line for root node
  const effectiveWordsPerLine = isRoot ? 3 : Math.min(wordsPerLine, 6);

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

  // Apply line breaks for better readability - strictly limit to max 6 words per line
  const words = processedText.split(' ');

  // Truncate to maximum 6 words per node if longer
  const maxTotalWords = 6;
  const truncatedWords = words.length > maxTotalWords ? words.slice(0, maxTotalWords) : words;

  // If words were truncated, add ellipsis
  if (truncatedWords.length < words.length) {
    truncatedWords[truncatedWords.length - 1] += '...';
  }

  // Apply line breaks based on words per line limit
  if (truncatedWords.length <= effectiveWordsPerLine) return truncatedWords.join(' ');
  let result = '';
  for (let i = 0; i < truncatedWords.length; i += effectiveWordsPerLine) {
    const chunk = truncatedWords.slice(i, i + effectiveWordsPerLine).join(' ');
    result += chunk + (i + effectiveWordsPerLine < truncatedWords.length ? '\n' : '');
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
  const colors = ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd', '#ea81bb', '#dd7878', '#4699d9', '#fe640b', '#6dc7be', '#a5adcb', '#fea45c', '#40a02b', '#e64553', '#8839ef'];

  // Use the hash to select a color from palette
  return colors[Math.abs(hash) % colors.length];
};
interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
  pdfKey?: string | null;
  isLoading?: boolean; // New prop for loading state
}
const MindMapViewer = ({
  isMapGenerated,
  onMindMapReady,
  onExplainText,
  onRequestOpenChat,
  pdfKey,
  isLoading = false
}: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  // Changed initial direction to 'both' which corresponds to direction 2 in Mind Elixir
  const [direction, setDirection] = useState<'vertical' | 'horizontal' | 'both'>('both');
  const [zoomLevel, setZoomLevel] = useState(50); // Changed initial zoom to 50% (lowest)
  const {
    toast
  } = useToast();

  // Simulate loading progress when isLoading is true
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + 10;
          return next > 90 ? 90 : next; // Cap at 90% until actually loaded
        });
      }, 100);
    } else if (loadingProgress > 0 && loadingProgress < 100) {
      // Complete the loading when isLoading becomes false
      setLoadingProgress(100);

      // Reset after animation completes
      const timeout = setTimeout(() => {
        setLoadingProgress(0);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingProgress]);
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
        palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd', '#ea81bb', '#fea45c'],
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
          '--hover-box-shadow': '0 5px 15px rgba(0,0,0,0.08)'
        }
      };
      const options = {
        el: containerRef.current,
        // Changed direction from 0 to 2 (2 = both directions, 0 = horizontal, 1 = vertical)
        direction: 2 as const,
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
        theme: colorfulTheme,
        autoFit: true
      };

      // Add custom styles to node-menu and style-panel elements when they appear
      const observeStylePanel = () => {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                  // Style panel/node menu appeared - ensure it's visible
                  if (node.classList.contains('mind-elixir-style-panel') || node.classList.contains('node-style-panel') || node.classList.contains('style-wrap') || node.classList.contains('mind-elixir-node-menu')) {
                    node.style.display = 'block';
                    node.style.visibility = 'visible';
                    node.style.opacity = '1';
                    node.style.zIndex = '9999';

                    // Ensure the panel stays in view
                    setTimeout(() => {
                      const rect = node.getBoundingClientRect();
                      if (rect.right > window.innerWidth) {
                        node.style.left = window.innerWidth - rect.width - 20 + 'px';
                      }
                      if (rect.bottom > window.innerHeight) {
                        node.style.top = window.innerHeight - rect.height - 20 + 'px';
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
        // Try to load mindmap data for specific PDF if pdfKey is provided
        const savedData = pdfKey ? sessionStorage.getItem(`mindMapData_${pdfKey}`) : sessionStorage.getItem('mindMapData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Apply line breaks, emojis, and complete sentences to node topics
          const formatNodes = (node: any) => {
            if (node.topic) {
              // Special handling for root node - only keep title with 3-4 words per line
              if (node.id === 'root') {
                node.topic = formatNodeText(node.topic, 3, true);
              } else {
                // Enforce 3-5 words per line limit for all non-root nodes
                // Now with max 6 words total per node
                node.topic = formatNodeText(node.topic, 4);
              }
            }
            if (node.children && node.children.length > 0) {
              // For bidirectional layouts, update child nodes directions for balanced tree
              // We'll alternate directions for first-level children
              if (node.id === 'root') {
                node.children.forEach((child: any, index: number) => {
                  // Even indexes go to the right (0), odd indexes go to the left (1)
                  child.direction = index % 2 === 0 ? 0 : 1;
                });
              }
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
          // Updated to alternate child directions for balanced bidirectional layout
          data = {
            nodeData: {
              id: 'root',
              topic: '🧠 Research\nPaper Title',
              children: [
              // Even indexes (0, 2, 4, 6) go to the right (direction: 0)
              {
                id: 'bd1',
                topic: '🔍 Introduction provides\ncontext and sets\nthe stage for\nthe research.',
                direction: 0 as const,
                children: [{
                  id: 'bd1-1',
                  topic: '📘 Background establishes\nthe essential context\nfor understanding the\nresearch problem.'
                }, {
                  id: 'bd1-2',
                  topic: '⚠️ The problem statement\nclearly identifies the\nissue being addressed.'
                }, {
                  id: 'bd1-3',
                  topic: '🧩 Research gap identifies\nwhat is missing\nin current understanding.'
                }, {
                  id: 'bd1-4',
                  topic: '🎯 This study aims\nto test the\nhypothesis that addresses\nthe research gap.'
                }]
              },
              // Odd indexes (1, 3, 5) go to the left (direction: 1)
              {
                id: 'bd2',
                topic: '⚙️ Methodology describes\nhow the research\nwas conducted with\nappropriate rigor.',
                direction: 1 as const,
                children: [{
                  id: 'bd2-1',
                  topic: '🧪 The experimental setup\nwas carefully designed\nto collect reliable\nand valid data.'
                }, {
                  id: 'bd2-2',
                  topic: '🔬 Theoretical models provide\nthe foundation for\ntesting our research\nhypotheses.'
                }, {
                  id: 'bd2-3',
                  topic: '📋 Procedures were followed\nsystematically to ensure\nreproducibility of results.'
                }, {
                  id: 'bd2-4',
                  topic: '🔢 Key variables were\nidentified and measured\nusing validated instruments\nand techniques.'
                }]
              }, {
                id: 'bd3',
                topic: '📊 Results present the\nempirical findings without\ninterpretation.',
                direction: 0 as const,
                children: [{
                  id: 'bd3-1',
                  topic: '✨ Key findings demonstrate\nsignificant relationships between\nthe studied variables.'
                }, {
                  id: 'bd3-2',
                  topic: '📈 Visual representations of\ndata help to\nillustrate important patterns\nfound in the analysis.'
                }, {
                  id: 'bd3-3',
                  topic: '📏 Statistical analyses confirm\nthe significance of\nthe observed relationships.'
                }, {
                  id: 'bd3-4',
                  topic: '👁️ Careful observations reveal\nadditional patterns not\ninitially anticipated in\nthe design.'
                }]
              }, {
                id: 'bd4',
                topic: '💭 Discussion explores the\nmeaning and implications\nof the results.',
                direction: 1 as const,
                children: [{
                  id: 'bd4-1',
                  topic: '🔎 Interpretation of results\nexplains what the\nfindings mean in\nrelation to the research\nquestions.'
                }, {
                  id: 'bd4-2',
                  topic: '🔄 Comparison with previous\nwork shows how\nthis research contributes\nto the field.'
                }, {
                  id: 'bd4-3',
                  topic: '💡 Implications suggest how\nthese findings might\nimpact theory and\npractice.'
                }, {
                  id: 'bd4-4',
                  topic: '🛑 Limitations acknowledge the\nconstraints that affect\nthe interpretation of\nthe results.'
                }]
              }, {
                id: 'bd5',
                topic: '🎯 Conclusion summarizes the\nkey contributions and\nfuture directions.',
                direction: 0 as const,
                children: [{
                  id: 'bd5-1',
                  topic: '✅ The summary of\ncontributions highlights the\nmain advancements made\nby this research.'
                }, {
                  id: 'bd5-2',
                  topic: '🔮 Future work recommendations\nidentify promising directions\nfor extending this\nresearch.'
                }, {
                  id: 'bd5-3',
                  topic: '🏁 Final remarks emphasize\nthe broader significance\nof this work\nto the field.'
                }]
              }, {
                id: 'bd6',
                topic: '📚 References provide a\ncomprehensive list of\nsources that informed\nthis work.',
                direction: 1 as const,
                children: [{
                  id: 'bd6-1',
                  topic: '📄 Key papers cited\nin this work\nestablish the theoretical\nfoundation for the research.'
                }, {
                  id: 'bd6-2',
                  topic: '🛠️ Datasets and tools\nused in the\nanalysis are properly\ndocumented for reproducibility.'
                }]
              }, {
                id: 'bd7',
                topic: '📎 Supplementary materials provide\nadditional details supporting\nthe main text.',
                direction: 0 as const,
                children: [{
                  id: 'bd7-1',
                  topic: '🧮 Additional experiments that\ndidn\'t fit in\nthe main text\nare included here.'
                }, {
                  id: 'bd7-2',
                  topic: '📑 Appendices contain detailed\nmethodological information for\ninterested readers.'
                }, {
                  id: 'bd7-3',
                  topic: '💾 Code and data\nare made available\nto ensure transparency\nand reproducibility.'
                }]
              }]
            }
          };
        }
      } catch (error) {
        console.error("Error parsing mind map data:", error);
        data = {
          nodeData: {
            id: 'root',
            topic: '⚠️ Error\nLoading\nMind Map',
            children: [{
              id: 'error1',
              topic: 'There was an error loading the mind map data. Please try refreshing the page.',
              direction: 0 as const
            }]
          }
        };
      }

      // Initialize the mind map with data
      mind.init(data);

      // Set initial zoom to lowest (50%)
      setTimeout(() => {
        mind.scale(0.5); // Set zoom to 50% (lowest)
        setZoomLevel(50);
      }, 300);

      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;

      // Enhanced clickability for nodes with style panel support
      if (containerRef.current) {
        const topicElements = containerRef.current.querySelectorAll('.mind-elixir-topic');
        topicElements.forEach(element => {
          element.addEventListener('click', e => {
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
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
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
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true
        });
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
        duration: 5000
      });

      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        setIsReady(true);
      }, 300);

      // Add event listener for node operations to enforce word limit per line
      mind.bus.addListener('operation', (operation: any) => {
        if (operation.name === 'editTopic') {
          const nodeObj = operation.obj;
          if (nodeObj && nodeObj.topic) {
            // Format node text to enforce max 6 words per node
            const isRoot = nodeObj.id === 'root';
            const wordsPerLine = isRoot ? 3 : 4;

            // Format the node text after a short delay to allow the edit to complete
            setTimeout(() => {
              // Get the current node text after editing
              // Using type assertion (as any) to access methods not defined in the TypeScript interface
              const currentNode = (mind as any).findNodeObj(nodeObj.id);
              if (currentNode) {
                // Format with max 6 words total per node
                const formattedText = formatNodeText(currentNode.topic, wordsPerLine, isRoot);

                // Update the node text with formatted version
                // Using type assertion (as any) to access methods not defined in the TypeScript interface
                (mind as any).updateNodeText(nodeObj.id, formattedText);
              }
            }, 100);
          }
        }
      });

      // Cleanup function
      return () => {
        styleObserver.disconnect();
        observer.disconnect();
      };
    }
  }, [isMapGenerated, onMindMapReady, toast, onExplainText, onRequestOpenChat, pdfKey]);

  // Listen for PDF switching events and update mindmap
  useEffect(() => {
    const handlePdfSwitched = (event: CustomEvent) => {
      if (event.detail?.pdfKey && mindMapRef.current) {
        const newPdfKey = event.detail.pdfKey;

        // Load the mindmap data for this PDF
        try {
          const savedData = sessionStorage.getItem(`mindMapData_${newPdfKey}`);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            mindMapRef.current.init(parsedData);
            console.log(`Loaded mindmap for PDF: ${newPdfKey}`);
          }
        } catch (error) {
          console.error(`Error loading mindmap for PDF ${newPdfKey}:`, error);
        }
      }
    };

    // Listen for PDF switching events
    window.addEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    return () => {
      window.removeEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    };
  }, []);

  // Function to handle zoom in
  const handleZoomIn = () => {
    if (mindMapRef.current) {
      mindMapRef.current.scale(1.1);
      setZoomLevel(prev => Math.min(prev + 10, 200));
    }
  };

  // Function to handle zoom out
  const handleZoomOut = () => {
    if (mindMapRef.current) {
      mindMapRef.current.scale(0.9);
      setZoomLevel(prev => Math.max(prev - 10, 20));
    }
  };

  // Function to toggle layout direction
  const toggleDirection = (value: 'vertical' | 'horizontal' | 'both') => {
    if (!mindMapRef.current) return;
    let directionValue: number;
    switch (value) {
      case 'horizontal':
        directionValue = 0;
        break;
      case 'vertical':
        directionValue = 1;
        break;
      case 'both':
      default:
        directionValue = 2;
        break;
    }

    // Update direction in mind map instance
    if (mindMapRef.current) {
      // Access direction property using type assertion
      (mindMapRef.current as any).direction = directionValue;
      // Re-render the mind map with new direction
      mindMapRef.current.refresh();
    }
    setDirection(value);
  };

  // Function to generate a node summary when requested from context menu
  const generateNodeSummary = (node: any) => {
    if (!node || !node.topic) return;

    // Get node text and children text to provide context
    let nodeText = node.topic;
    let childrenText = '';
    if (node.children && node.children.length > 0) {
      childrenText = node.children.map((child: any) => child.topic).join(', ');
    }

    // Create a summary based on node and its children
    const nodeSummary = `Topic: ${nodeText}\n\nSubtopics: ${childrenText || 'None'}`;

    // Set summary and show dialog
    setSummary(nodeSummary);
    setShowSummary(true);

    // If chat panel integration is available, send to chat
    if (onExplainText) {
      const prompt = `Please explain more about this topic: ${nodeText}. Include information about these subtopics if relevant: ${childrenText}`;
      onExplainText(prompt);
      onRequestOpenChat?.();
    }
  };
  return <div className="relative w-full h-full flex flex-col">
      {/* Loading progress indicator */}
      {loadingProgress > 0 && loadingProgress < 100 && <div className="absolute top-0 left-0 w-full z-10">
          <Progress value={loadingProgress} className="h-1 rounded-none" />
        </div>}

      {/* Main mind map container */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? <div className="w-full h-full flex items-center justify-center">
            <div className="w-3/4 max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <p className="text-sm font-medium">Generating mind map...</p>
              </div>
              <Skeleton className="h-[60vh] w-full rounded-lg" />
            </div>
          </div> : <div ref={containerRef} className="w-full h-full mind-elixir-container" style={{
        visibility: isMapGenerated ? 'visible' : 'hidden'
      }} />}
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        {/* Zoom controls */}
        

        {/* Direction controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2">
          <ToggleGroup type="single" size="sm" value={direction} onValueChange={value => {
          if (value) toggleDirection(value as 'vertical' | 'horizontal' | 'both');
        }}>
            <ToggleGroupItem value="horizontal" title="Horizontal layout">
              <ArrowRight size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="vertical" title="Vertical layout">
              <ArrowDown size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="both" title="Bidirectional layout">
              <div className="flex">
                <ArrowLeft size={16} />
                <ArrowRight size={16} />
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node Summary</DialogTitle>
            <DialogDescription>
              Details about the selected node and its connections
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Close
            </Button>
            {onExplainText && <Button onClick={() => {
            onExplainText(summary);
            onRequestOpenChat?.();
            setShowSummary(false);
          }}>
                <FileText className="mr-2 h-4 w-4" />
                Explain in Chat
              </Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default MindMapViewer;