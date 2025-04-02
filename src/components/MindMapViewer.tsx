
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenuNeo from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText, Image, ZoomIn, ZoomOut } from "lucide-react";
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

// Interface for PDF images
interface PdfImage {
  imageData: string;
  pageNumber: number;
  width: number;
  height: number;
  caption?: string;
  relevantTopics?: string[];
}

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<ExtendedMindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [pdfImages, setPdfImages] = useState<PdfImage[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { toast } = useToast();

  // Extract images from PDF on component mount
  useEffect(() => {
    const extractImagesFromPdf = async () => {
      try {
        // Import pdfjs dynamically to avoid SSR issues
        const pdfjs = await import('pdfjs-dist');
        
        // Set worker path explicitly with CDNJS URL that matches the exact version
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        
        const pdfDataUrl = sessionStorage.getItem("pdfData");
        
        if (!pdfDataUrl) {
          return;
        }
        
        const pdfData = atob(pdfDataUrl.split(',')[1]);
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const extractedImages: PdfImage[] = [];
        
        // Process each page
        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
          const page = await pdf.getPage(pageNum);
          const operatorList = await page.getOperatorList();
          const textContent = await page.getTextContent();
          
          // Extract all text items with their positions for caption analysis
          const textItems = textContent.items.map(item => ({
            text: 'str' in item ? item.str : '',
            x: 'transform' in item ? item.transform[4] : 0,
            y: 'transform' in item ? item.transform[5] : 0,
            height: 'height' in item ? item.height : 0,
            width: 'width' in item ? item.width : 0
          }));
          
          // Look for image operators in the page
          for (let i = 0; i < operatorList.fnArray.length; i++) {
            // Check for image operators
            if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
              const imgArgs = operatorList.argsArray[i];
              const imgId = imgArgs[0];
              
              try {
                // Get the image data
                const objs = await page.objs.get(imgId);
                
                if (objs && objs.data && objs.width && objs.height) {
                  // Create canvas to convert image data to data URL
                  const canvas = document.createElement('canvas');
                  canvas.width = objs.width;
                  canvas.height = objs.height;
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    // Create ImageData object
                    const imgData = new ImageData(
                      new Uint8ClampedArray(objs.data),
                      objs.width,
                      objs.height
                    );
                    ctx.putImageData(imgData, 0, 0);
                    
                    // Get image as data URL
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    // Only add if image is not too small (likely not a meaningful figure)
                    if (objs.width > 100 && objs.height > 100) {
                      // Try to find caption by looking for text positioned below the image
                      const potentialCaptions = findPotentialCaptions(textItems, { 
                        width: objs.width,
                        height: objs.height
                      });
                      
                      extractedImages.push({
                        imageData: dataUrl,
                        pageNumber: pageNum,
                        width: objs.width,
                        height: objs.height,
                        caption: potentialCaptions.length > 0 ? potentialCaptions.join(" ") : undefined,
                        relevantTopics: deriveTopicsFromCaption(potentialCaptions.join(" "))
                      });
                    }
                  }
                }
              } catch (error) {
                console.error(`Error processing image ${imgId} on page ${pageNum}:`, error);
              }
            }
          }
        }
        
        setPdfImages(extractedImages);
        console.log(`Extracted ${extractedImages.length} images from PDF with captions`);
        
        if (extractedImages.length > 0) {
          // Auto-add images to relevant nodes in the mind map
          setTimeout(() => {
            autoPlaceImagesInMindMap(extractedImages);
          }, 1000);
        }
      } catch (error) {
        console.error('Error extracting images from PDF:', error);
        toast({
          title: "Error extracting images",
          description: "There was an error extracting images from the PDF. Some features may not work correctly.",
          variant: "destructive"
        });
      }
    };
    
    if (isMapGenerated) {
      extractImagesFromPdf();
    }
  }, [isMapGenerated]);

  // Find potential captions by analyzing text positioned near an image
  const findPotentialCaptions = (textItems: any[], imgObj: any): string[] => {
    // Look for text that might be captions
    // Common patterns: "Figure X:", "Table X:", text that starts with "Fig."
    const captions: string[] = [];
    
    for (let i = 0; i < textItems.length; i++) {
      const text = textItems[i].text.trim();
      
      // Skip empty text
      if (!text) continue;
      
      // Check for caption patterns
      if (
        text.match(/^(figure|fig\.?|table|diagram|chart)\s*\d+/i) || 
        text.match(/^(figure|fig\.?|table|diagram|chart):/i)
      ) {
        // Found potential caption start, collect this and following text
        let captionText = text;
        let j = i + 1;
        
        // Collect continuation text (usually captions span multiple text items)
        while (j < textItems.length && 
              !textItems[j].text.match(/^(figure|fig\.?|table|diagram|chart)\s*\d+/i) &&
              Math.abs(textItems[j].y - textItems[i].y) < 20) {
          captionText += " " + textItems[j].text.trim();
          j++;
        }
        
        captions.push(captionText);
        i = j - 1; // Skip processed items
      }
    }
    
    return captions;
  };
  
  // Derive potential topics from caption text
  const deriveTopicsFromCaption = (caption: string): string[] => {
    if (!caption) return [];
    
    const topics: string[] = [];
    const captionLower = caption.toLowerCase();
    
    // Extract key terms that might indicate topic relevance
    const keyTerms = [
      { term: "method", topic: "Methodology" },
      { term: "approach", topic: "Methodology" },
      { term: "result", topic: "Results" },
      { term: "finding", topic: "Results" },
      { term: "data", topic: "Results" },
      { term: "analysis", topic: "Discussion" },
      { term: "performance", topic: "Results" },
      { term: "accuracy", topic: "Results" },
      { term: "model", topic: "Methodology" },
      { term: "framework", topic: "Methodology" },
      { term: "architecture", topic: "Methodology" },
      { term: "comparison", topic: "Discussion" },
      { term: "overview", topic: "Introduction" },
      { term: "system", topic: "Methodology" },
      { term: "process", topic: "Methodology" },
      { term: "workflow", topic: "Methodology" },
      { term: "conclusion", topic: "Conclusion" }
    ];
    
    // Check if caption contains any key terms
    keyTerms.forEach(({ term, topic }) => {
      if (captionLower.includes(term) && !topics.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics;
  };

  // Auto-place images in mind map based on caption analysis
  const autoPlaceImagesInMindMap = (images: PdfImage[]) => {
    if (!mindMapRef.current || images.length === 0) return;
    
    const mind = mindMapRef.current;
    const data = mind.nodeData;
    
    // Find nodes that match topics
    const findNodesForTopics = (topicList: string[] = []): string[] => {
      if (!topicList || topicList.length === 0) return [];
      
      const matchingNodeIds: string[] = [];
      
      // Helper function to recursively search nodes
      const searchNodes = (node: any) => {
        if (!node) return;
        
        // Check if node topic matches any of the topics
        const nodeTopic = node.topic ? node.topic.toLowerCase() : '';
        
        for (const topic of topicList) {
          if (nodeTopic.includes(topic.toLowerCase())) {
            matchingNodeIds.push(node.id);
            break;
          }
        }
        
        // Check children
        if (node.children && node.children.length > 0) {
          node.children.forEach(searchNodes);
        }
      };
      
      // Start search from root
      searchNodes(data);
      
      return matchingNodeIds;
    };
    
    // Categorize images by content section
    const sectionImages: Record<string, PdfImage[]> = {
      "Introduction": [],
      "Methodology": [],
      "Results": [],
      "Discussion": [],
      "Conclusion": [],
      "Other": []
    };
    
    // Assign images to sections based on their topics or page position
    images.forEach(img => {
      let assigned = false;
      
      if (img.relevantTopics && img.relevantTopics.length > 0) {
        // Assign to the first matching section
        for (const topic of img.relevantTopics) {
          if (topic in sectionImages) {
            sectionImages[topic].push(img);
            assigned = true;
            break;
          }
        }
      }
      
      // If not assigned to a specific section, use page number as a heuristic
      if (!assigned) {
        const pageRatio = img.pageNumber / 20; // Assumes max 20 pages
        
        if (pageRatio < 0.2) {
          sectionImages["Introduction"].push(img);
        } else if (pageRatio < 0.4) {
          sectionImages["Methodology"].push(img);
        } else if (pageRatio < 0.6) {
          sectionImages["Results"].push(img);
        } else if (pageRatio < 0.8) {
          sectionImages["Discussion"].push(img);
        } else {
          sectionImages["Conclusion"].push(img);
        }
      }
    });
    
    // Place images in matching nodes
    Object.entries(sectionImages).forEach(([section, sectionImgs]) => {
      if (sectionImgs.length === 0) return;
      
      // Find nodes for this section
      const nodeIds = findNodesForTopics([section]);
      
      if (nodeIds.length > 0) {
        // Distribute images among matching nodes, focusing on leaf nodes
        const maxImagesPerNode = Math.ceil(sectionImgs.length / nodeIds.length);
        
        let imageIndex = 0;
        for (const nodeId of nodeIds) {
          if (imageIndex >= sectionImgs.length) break;
          
          // Find the node by ID
          const node = mind.findNodeById(nodeId);
          if (!node) continue;
          
          // Add image to the node
          node.image = sectionImgs[imageIndex].imageData;
          imageIndex++;
          
          // If this node has children, add images to them too
          if (node.children && node.children.length > 0 && imageIndex < sectionImgs.length) {
            for (let i = 0; i < Math.min(node.children.length, maxImagesPerNode - 1); i++) {
              if (imageIndex >= sectionImgs.length) break;
              
              const childNode = node.children[i];
              childNode.image = sectionImgs[imageIndex].imageData;
              imageIndex++;
            }
          }
        }
        
        // If we still have images, add them to "Other" nodes
        if (imageIndex < sectionImgs.length) {
          const otherNodeIds = findNodesForTopics(["Figure", "Image", "Diagram", "Chart", "Table", "Visual"]);
          
          for (const nodeId of otherNodeIds) {
            if (imageIndex >= sectionImgs.length) break;
            
            const node = mind.findNodeById(nodeId);
            if (!node || node.image) continue; // Skip if already has an image
            
            node.image = sectionImgs[imageIndex].imageData;
            imageIndex++;
          }
        }
      }
    });
    
    // Refresh the mind map to show images
    mind.refresh();
    
    if (images.length > 0) {
      toast({
        title: "Images added to mind map",
        description: `${Math.min(images.length, 5)} images from the PDF have been added to relevant sections.`,
        duration: 5000,
      });
    }
  };

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
        nodeMenu: true, // Ensure node menu is enabled
        tools: {
          zoom: true,
          create: true,
          edit: true,
          layout: true,
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
          
          // Check if node has image data
          if (node.image) {
            // Create image element
            const imgContainer = document.createElement('div');
            imgContainer.style.marginTop = '10px';
            imgContainer.style.width = '100%';
            imgContainer.style.display = 'flex';
            imgContainer.style.justifyContent = 'center';
            
            const img = document.createElement('img');
            img.src = node.image;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '4px';
            img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            imgContainer.appendChild(img);
            tpc.appendChild(imgContainer);
          }
          
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
      const mind = new MindElixir(options);
      
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
        }
      } catch (error) {
        console.error('Error parsing stored mind map data:', error);
      }
      
      if (!data) {
        // Default minimal structure if no data is available
        data = {
          nodeData: {
            id: 'root',
            topic: '📑 Paper Summary',
            root: true,
            children: []
          }
        };
      }
      
      // Initialize the mind map with data
      mind.init(data);
      
      // Register with Neo Node Menu
      mind.nodeMenu = nodeMenuNeo;
      
      // Set up event handlers
      mind.bus.addListener('operation', (operation: any) => {
        // Save data when mind map changes
        try {
          const data = mind.getData();
          sessionStorage.setItem('mindElixirData', JSON.stringify(data));
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
          // Skip if it's just a short topic without meaningful content
          if (node.topic.length > 15 || node.children?.length > 0) {
            onExplainText(node.topic);
          }
        }
      });
      
      // Apply custom styles to menus after initialization
      setTimeout(addCustomStylesToMenus, 500);
      
      // Store the mind map instance in ref
      mindMapRef.current = mind as ExtendedMindElixirInstance;
      setIsReady(true);
      
      // Notify parent that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
    }
  }, [isMapGenerated, onExplainText, onMindMapReady]);

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

  // Export the mindmap as SVG
  const handleExportSVG = () => {
    if (!mindMapRef.current) return;
    
    try {
      // Use the utility function to download as SVG
      downloadMindMapAsSVG(mindMapRef.current, "mindmap");
      
      toast({
        title: "Export successful",
        description: "Your mind map has been exported as SVG.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error exporting mind map:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your mind map.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Render the component
  return (
    <div className="flex flex-col h-full">
      {/* Mind map container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
      />
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </Button>
        
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </Button>
        
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleExportSVG}
          title="Export as SVG"
        >
          <FileText size={18} />
        </Button>
      </div>
    </div>
  );
};

export default MindMapViewer;
