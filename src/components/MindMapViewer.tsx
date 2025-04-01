import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenuNeo from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileText, Image, ZoomIn, ZoomOut } from "lucide-react";

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
  const mindMapRef = useRef<MindElixirInstance | null>(null);
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
      
      // Install the node menu plugin with full styling support
      const customNodeMenu = nodeMenuNeo;
      
      // Add custom options to node menu
      customNodeMenu.menus = (node: any, mind: MindElixirInstance) => {
        return [
          {
            name: 'Delete',
            handler: () => {
              mind.removeNode();
            }
          },
          {
            name: 'Edit',
            handler: () => {
              mind.beginEdit();
            }
          },
          {
            name: 'Add Child',
            handler: () => {
              const topic = prompt('Enter the child topic name', 'New Topic');
              if (topic) {
                mind.addChild(topic);
              }
            }
          },
          {
            name: 'Add Sibling',
            handler: () => {
              if (node.id === 'root') return; // Can't add sibling to root
              const topic = prompt('Enter the sibling topic name', 'New Topic');
              if (topic) {
                mind.insertSibling(topic);
              }
            }
          },
          {
            name: '✨ Generate Summary',
            handler: () => {
              generateNodeSummary(node);
            }
          },
          {
            name: '🖼️ Add Image',
            handler: () => {
              setSelectedNodeId(node.id);
              setShowImagePicker(true);
            }
          },
          ...(node.image ? [{
            name: '❌ Remove Image',
            handler: () => {
              delete node.image;
              mind.refresh();
            }
          }] : [])
        ];
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
      
      // Attach zoom controls to the mind map
      const zoomIn = () => {
        setZoomLevel(prev => {
          const newZoom = Math.min(prev + 0.1, 2);
          mind.scale(newZoom);
          return newZoom;
        });
      };
      
      const zoomOut = () => {
        setZoomLevel(prev => {
          const newZoom = Math.max(prev - 0.1, 0.5);
          mind.scale(newZoom);
          return newZoom;
        });
      };
      
      // Add the mind map instance to the ref for external access
      mindMapRef.current = mind;
      
      // Make the zoom methods available on the mind map instance
      (mindMapRef.current as any).zoomIn = zoomIn;
      (mindMapRef.current as any).zoomOut = zoomOut;
      
      // Notify parent component that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
      
      // Show a toast notification to inform users about right-click functionality
      toast({
        title: "Mind Map Ready",
        description: "Right-click on nodes to access the menu and add images. Use the zoom buttons to adjust the view.",
        duration: 5000,
      });
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        setIsReady(true);
      }, 300);
      
      // Cleanup function
      return () => {
        styleObserver.disconnect();
      };
    }
  }, [isMapGenerated, onMindMapReady, toast]);

  // Function to generate summaries for nodes and their children
  const generateNodeSummary = (nodeData: any) => {
    if (!nodeData) return;
    
    // Generate a simple summary from the node hierarchy
    let summaryText = `## Summary of "${nodeData.topic}"\n\n`;
    
    // Helper function to extract node topics and build a hierarchical summary
    const extractTopics = (node: any, level: number = 0) => {
      if (!node) return '';
      
      // Replace emojis and extra whitespace
      const cleanTopic = (topic: string) => {
        return topic.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]\s?/g, '').trim();
      };
      
      let result = '';
      const indent = '  '.repeat(level);
      
      if (node.topic) {
        result += `${indent}- ${cleanTopic(node.topic)}\n`;
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          result += extractTopics(child, level + 1);
        });
      }
      
      return result;
    };
    
    // Generate the hierarchical summary
    summaryText += extractTopics(nodeData);
    
    // Add a conclusion
    summaryText += `\n## Key Points\n\n`;
    summaryText += `This branch of the mind map contains ${countNodes(nodeData)} nodes in total.\n`;
    
    // Display the summary
    setSummary(summaryText);
    setShowSummary(true);
    
    toast({
      title: "Summary Generated",
      description: `Summary for "${nodeData.topic}" is ready to view.`,
      duration: 3000,
    });
  };
  
  // Helper function to count nodes in a branch
  const countNodes = (node: any): number => {
    if (!node) return 0;
    
    let count = 1; // Count the current node
    
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        count += countNodes(child);
      });
    }
    
    return count;
  };
  
  // Close the summary panel
  const closeSummary = () => {
    setShowSummary(false);
  };

  // Add image to node
  const addImageToNode = (imageData: string) => {
    if (!mindMapRef.current || !selectedNodeId) return;
    
    const node = mindMapRef.current.findNodeById(selectedNodeId);
    
    if (node) {
      // Add image data to node
      node.image = imageData;
      
      // Refresh the mind map
      mindMapRef.current.refresh();
      
      toast({
        title: "Image added",
        description: "The image has been added to the node. You may need to resize the node to see it better."
      });
    }
    
    // Close image picker
    setShowImagePicker(false);
    setSelectedNodeId(null);
  };

  const handleZoomIn = () => {
    if (mindMapRef.current && (mindMapRef.current as any).zoomIn) {
      (mindMapRef.current as any).zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (mindMapRef.current && (mindMapRef.current as any).zoomOut) {
      (mindMapRef.current as any).zoomOut();
    }
  };

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      {showSummary && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-white z-10 shadow-lg flex flex-col">
          <div className="bg-primary p-3 text-white flex justify-between items-center">
            <h3 className="font-medium">Mind Map Summary</h3>
            <Button variant="ghost" size="sm" onClick={closeSummary} className="text-white">
              Close
            </Button>
          </div>
          <div className="p-4 overflow-auto flex-1">
            <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
          </div>
        </div>
      )}
      
      {showImagePicker && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-[80%] max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select an image for the mind map node</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowImagePicker(false);
                  setSelectedNodeId(null);
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="overflow-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pdfImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => addImageToNode(img.imageData)}
                  >
                    <img 
                      src={img.imageData} 
                      alt={`PDF image ${index + 1}`} 
                      className="w-full h-32 object-contain"
                    />
                    <div className="text-xs text-center mt-2">
                      Page {img.pageNumber} • {img.width}×{img.height}
                      {img.caption && (
                        <div className="mt-1 text-xs text-gray-600 truncate" title={img.caption}>
                          {img.caption.length > 50 ? img.caption.substring(0, 50) + "..." : img.caption}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {pdfImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No images found in the PDF document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full h-full overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ 
            background: `linear-gradient(90deg, #F9F7FF 0%, #E5DEFF 100%)`,
            transition: 'background-color 0.5s ease'
          }}
        />
        
        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        
        {pdfImages.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                toast({
                  title: "Image Integration",
                  description: `${pdfImages.length} images extracted from PDF. Right-click on any node to add an image.`
                });
              }}
            >
              <Image className="h-4 w-4" />
              {pdfImages.length} PDF Images
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapViewer;
