
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { enhanceMindMapWithEmojis, validateMindMapContent } from "@/utils/mindMapUtils";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
  pdfKey?: string | null; // Add the pdfKey prop
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
    if (!/^\p{Emoji}/u.test(processedText)) {
      processedText = addEmoji(text);
    }
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

// Add emoji based on topic content - more detailed version
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
  if (topicLower.includes('purpose') || topicLower.includes('aim')) return '🏹 ' + topic;
  if (topicLower.includes('scope')) return '🔭 ' + topic;
  
  // Methodology subsections
  if (topicLower.includes('experimental') || topicLower.includes('experiment')) return '🧪 ' + topic;
  if (topicLower.includes('data collection') || topicLower.includes('sampling')) return '📥 ' + topic;
  if (topicLower.includes('model') || topicLower.includes('theory') || topicLower.includes('framework')) return '🔬 ' + topic;
  if (topicLower.includes('procedure') || topicLower.includes('algorithm')) return '📋 ' + topic;
  if (topicLower.includes('variable') || topicLower.includes('parameter')) return '🔢 ' + topic;
  if (topicLower.includes('participant') || topicLower.includes('subject')) return '👥 ' + topic;
  if (topicLower.includes('equipment') || topicLower.includes('device')) return '🔧 ' + topic;
  if (topicLower.includes('design')) return '📐 ' + topic;
  if (topicLower.includes('protocol')) return '📜 ' + topic;
  if (topicLower.includes('technique')) return '🛠️ ' + topic;
  
  // Results subsections
  if (topicLower.includes('key finding') || topicLower.includes('main result')) return '✨ ' + topic;
  if (topicLower.includes('figure') || topicLower.includes('chart') || topicLower.includes('visualization')) return '📈 ' + topic;
  if (topicLower.includes('table') || topicLower.includes('data')) return '📊 ' + topic;
  if (topicLower.includes('statistical') || topicLower.includes('analysis')) return '📏 ' + topic;
  if (topicLower.includes('measurement')) return '📏 ' + topic;
  if (topicLower.includes('observation')) return '👁️ ' + topic;
  if (topicLower.includes('outcome') || topicLower.includes('output')) return '🏆 ' + topic;
  if (topicLower.includes('performance')) return '🏃 ' + topic;
  if (topicLower.includes('accuracy') || topicLower.includes('precision')) return '🎯 ' + topic;
  if (topicLower.includes('comparison')) return '⚖️ ' + topic;
  if (topicLower.includes('trend')) return '📉 ' + topic;
  if (topicLower.includes('calculation')) return '🧮 ' + topic;
  
  // Discussion subsections
  if (topicLower.includes('interpretation')) return '🔎 ' + topic;
  if (topicLower.includes('comparison') || topicLower.includes('previous work')) return '🔄 ' + topic;
  if (topicLower.includes('implication')) return '💡 ' + topic;
  if (topicLower.includes('limitation')) return '🛑 ' + topic;
  if (topicLower.includes('strength') || topicLower.includes('advantage')) return '💪 ' + topic;
  if (topicLower.includes('weakness') || topicLower.includes('disadvantage')) return '⚠️ ' + topic;
  if (topicLower.includes('explanation')) return '💬 ' + topic;
  if (topicLower.includes('significance')) return '✅ ' + topic;
  if (topicLower.includes('insight')) return '🔮 ' + topic;
  
  // Conclusion subsections
  if (topicLower.includes('summary') || topicLower.includes('contribution')) return '✅ ' + topic;
  if (topicLower.includes('future work') || topicLower.includes('future direction')) return '🔮 ' + topic;
  if (topicLower.includes('recommendation')) return '📝 ' + topic;
  if (topicLower.includes('final') || topicLower.includes('remark')) return '🏁 ' + topic;
  if (topicLower.includes('impact')) return '💥 ' + topic;
  if (topicLower.includes('takeaway')) return '🔑 ' + topic;
  
  // References subsections
  if (topicLower.includes('key paper') || topicLower.includes('cited')) return '📄 ' + topic;
  if (topicLower.includes('dataset') || topicLower.includes('tool')) return '🛠️ ' + topic;
  if (topicLower.includes('author')) return '✍️ ' + topic;
  if (topicLower.includes('journal')) return '📰 ' + topic;
  if (topicLower.includes('publication')) return '📑 ' + topic;
  
  // Supplementary subsections
  if (topicLower.includes('additional') || topicLower.includes('experiment')) return '🧮 ' + topic;
  if (topicLower.includes('appendix') || topicLower.includes('appendices')) return '📑 ' + topic;
  if (topicLower.includes('code') || topicLower.includes('data availability')) return '💾 ' + topic;
  if (topicLower.includes('detail')) return '🔍 ' + topic;
  if (topicLower.includes('resource')) return '📦 ' + topic;
  
  // Research methods
  if (topicLower.includes('survey')) return '📝 ' + topic;
  if (topicLower.includes('interview')) return '🎤 ' + topic;
  if (topicLower.includes('observation')) return '👁️ ' + topic;
  if (topicLower.includes('case study')) return '🔍 ' + topic;
  if (topicLower.includes('simulation')) return '🖥️ ' + topic;
  if (topicLower.includes('test')) return '🧪 ' + topic;
  
  // Analysis techniques
  if (topicLower.includes('regression')) return '📉 ' + topic;
  if (topicLower.includes('classification')) return '🔠 ' + topic;
  if (topicLower.includes('clustering')) return '🔣 ' + topic;
  if (topicLower.includes('neural network') || topicLower.includes('deep learning')) return '🧠 ' + topic;
  if (topicLower.includes('machine learning')) return '🤖 ' + topic;
  if (topicLower.includes('natural language') || topicLower.includes('nlp')) return '💬 ' + topic;
  if (topicLower.includes('computer vision')) return '👁️ ' + topic;
  
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
  
  // Domain-specific topics
  if (topicLower.includes('medicine') || topicLower.includes('health')) return '🏥 ' + topic;
  if (topicLower.includes('biology') || topicLower.includes('gene')) return '🧬 ' + topic;
  if (topicLower.includes('physics')) return '⚛️ ' + topic;
  if (topicLower.includes('chemistry')) return '⚗️ ' + topic;
  if (topicLower.includes('astronomy') || topicLower.includes('space')) return '🌌 ' + topic;
  if (topicLower.includes('earth') || topicLower.includes('geology')) return '🌍 ' + topic;
  if (topicLower.includes('climate')) return '🌡️ ' + topic;
  if (topicLower.includes('psychology')) return '🧠 ' + topic;
  if (topicLower.includes('sociology')) return '👥 ' + topic;
  if (topicLower.includes('economics') || topicLower.includes('finance')) return '💰 ' + topic;
  if (topicLower.includes('business')) return '💼 ' + topic;
  if (topicLower.includes('education')) return '🎓 ' + topic;
  if (topicLower.includes('history')) return '📜 ' + topic;
  if (topicLower.includes('art')) return '🎨 ' + topic;
  if (topicLower.includes('music')) return '🎵 ' + topic;
  if (topicLower.includes('technology')) return '💻 ' + topic;
  
  // Default emoji for unmatched topics
  const defaultEmojis = ['📌', '🔹', '💠', '🔸', '✨', '🔆', '📍', '🔶', '🔷', '💫'];
  const hash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const emojiIndex = hash % defaultEmojis.length;
  
  return defaultEmojis[emojiIndex] + ' ' + topic;
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

// Generate summary of a node and its children
const generateNodeSummary = (node: any) => {
  // This function would generate a summary of a node and its children
  console.log("Generating summary for node:", node);
  
  // This is a placeholder for actual AI-powered summary generation
  return `Summary of ${node.topic}`;
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat, pdfKey }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const { toast } = useToast();
  
  // Debug pdfKey prop
  useEffect(() => {
    console.log("MindMapViewer current pdfKey:", pdfKey);
  }, [pdfKey]);

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
        
        // Add emoji enhancement option
        menus.push({
          name: '🎨 Enhance with Emoji',
          onclick: () => {
            // Add emoji to this node if it doesn't have one
            if (node && node.topic && !/^\p{Emoji}/u.test(node.topic)) {
              node.topic = addEmoji(node.topic);
              mindInstance.refresh();
            }
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
        console.log("Attempting to load mindmap data for:", pdfKey);
        const mindMapKey = pdfKey ? `mindMapData_${pdfKey}` : 'mindMapData';
        const savedData = sessionStorage.getItem(mindMapKey);
          
        if (savedData) {
          console.log(`Found mind map data in sessionStorage with key: ${mindMapKey}`);
          const parsedData = JSON.parse(savedData);
          
          if (!parsedData || !parsedData.nodeData) {
            console.warn("Invalid mind map data structure:", parsedData);
            throw new Error("Invalid mind map data structure");
          }
          
          console.log("Successfully loaded mind map data:", parsedData.nodeData.topic);
          
          // Apply line breaks, emojis, and complete sentences to node topics
          const formatNodes = (node: any) => {
            if (node.topic) {
              // Add emoji if missing
              if (!/^\p{Emoji}/u.test(node.topic)) {
                node.topic = addEmoji(node.topic);
              }
              
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
          
          // Validate content richness
          const validation = validateMindMapContent(parsedData);
          console.log("Mind map validation:", validation);
          
          // If map has low emoji count, enhance it
          if (validation.emojiCount < validation.specificTermCount / 2) {
            console.log("Enhancing mind map with more emojis");
            parsedData = enhanceMindMapWithEmojis(parsedData);
          }
          
          data = parsedData;
        } else {
          console.warn(`No mind map data found with key: ${mindMapKey}, using default`);
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
      
      // Call enhanceConnectionLines after initialization and on data changes
      setTimeout(enhanceConnectionLines, 500);
      mind.bus.addListener('operation', enhanceConnectionLines);
      
      // Save mind map reference
      mindMapRef.current = mind;
      
      // Notify parent component that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
      
      // Set up a click handler for opening the chat with relevant text
      mind.bus.addListener('selectNode', (nodeObj: any) => {
        // When a node is selected, update explainText or open chat if needed
        if (onExplainText && nodeObj && nodeObj.topic) {
          // Either update the text, or if requested, also open chat
          const topicText = nodeObj.topic.replace(/^\p{Emoji}\s*/u, ''); // Remove emoji from start
          
          if (onRequestOpenChat) {
            // Only request opening chat on double-click
            const now = Date.now();
            if (mind.lastClickTime && now - mind.lastClickTime < 300) {
              onExplainText(topicText);
              onRequestOpenChat();
            }
            mind.lastClickTime = now;
          }
        }
      });
      
      // Set ready state to true
      setIsReady(true);
      
      // Return cleanup function to remove event listeners
      return () => {
        styleObserver.disconnect();
        observer.disconnect();
        
        // Clean up all event listeners when unmounting
        if (mind && mind.bus) {
          mind.bus.clearListeners();
        }
        
        // Clear mind map instance
        mindMapRef.current = null;
      };
    }
  }, [isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat, activePdfKey]);
  
  // Create a timer to recheck/refresh the mind map periodically based on actual PDF changes
  const activePdfKey = pdfKey;
  
  // Component render
  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="flex-grow relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#F9F7FF' }} // Match the theme background
        />
        
        {!isMapGenerated && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">No mind map yet</p>
              <p className="text-gray-500 mb-6">Upload a PDF document to generate a mind map</p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <FileText className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapViewer;
