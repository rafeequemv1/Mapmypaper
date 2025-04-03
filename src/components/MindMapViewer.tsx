
import { useEffect, useRef, useState } from "react";
import MindElixir, { type MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, LayoutGrid } from "lucide-react";
import { downloadMindMapAsSVG, downloadMindMapAsPNG, customZoomIn, customZoomOut } from "@/lib/export-utils";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady: (instance: any) => void;
  onExplainText: (text: string) => void;
  onRequestOpenChat: () => void;
}

interface NodeSummaryProps {
  node: any;
  summary: string;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
}

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isMapGenerated && containerRef.current) {
      const options = {
        el: containerRef.current,
        newTopicName: "New Node",
        direction: MindElixir.LEFT,
        locale: "en", // Use string directly since the LOCALE enum isn't recognized
        draggable: true,
        editable: true,
        contextMenu: true,
        nodeMenu: true,
        keypress: true,
        allowUndo: true,
        allowFold: true,
        before: {
          moveNode: (newNode: any, targetNode: any, direction: any) => {
            console.log("moveNode", newNode, targetNode, direction);
            return true;
          },
          addChild: (node: any) => {
            console.log("addChild", node);
            return true;
          },
          pasteNode: (node: any) => {
            console.log("pasteNode", node);
            return true;
          },
          removeNode: (node: any) => {
            console.log("removeNode", node);
            return true;
          },
          changeNodeTopic: (node: any, newTopic: any, oldTopic: any) => {
            console.log("changeNodeTopic", node, newTopic, oldTopic);
            return true;
          },
        },
      };

      // Using any type to bypass TypeScript errors with the mind-elixir API
      const mind = new MindElixir(options) as any;
      mindMapRef.current = mind;

      try {
        // Load data from session storage
        const storedData = sessionStorage.getItem("mindMapData");
        
        if (storedData && mind.init) {
          try {
            // Parse the stored data safely
            const parsedData = JSON.parse(storedData);
            if (parsedData && parsedData.nodeData) {
              mind.init(parsedData.nodeData);
              console.log("Loaded mind map from session storage");
            } else {
              // Handle case where nodeData is missing but JSON is valid
              initializeWithDefaultData(mind);
            }
          } catch (error) {
            console.error("Error parsing stored mind map data:", error);
            initializeWithDefaultData(mind);
          }
        } else {
          // Initialize with empty data structure if no stored data
          initializeWithDefaultData(mind);
        }
      } catch (error) {
        console.error("Error loading mind map data:", error);
        // Ensure we have a default mind map even if loading fails
        initializeWithDefaultData(mind);
      }

      // Use nodeMenu plugin
      if (mind.install) mind.install(nodeMenu);
      
      // Set up event listeners
      mind.bus.addListener("node-click", (node: any, event: any) => {
        console.log("Node click:", node);
      });

      mind.bus.addListener("contextmenu", (node: any, event: any) => {
        console.log("Node menu click:", node);
        if (event.target.textContent === "Explain") {
          onExplainText(node.topic);
        } else if (event.target.textContent === "Summarize") {
          generateNodeSummary(node);
        } else if (event.target.textContent === "Chat") {
          onRequestOpenChat();
        }
      });

      // Expose the mindmap instance to the parent component
      onMindMapReady(mind);
      setIsReady(true);

      // Clean up on unmount
      return () => {
        if (mind.destroy) mind.destroy();
        mindMapRef.current = null;
        setIsReady(false);
      };
    }
  }, [isMapGenerated, onExplainText, onMindMapReady, onRequestOpenChat, toast]);

  // Helper function to initialize with default data
  const initializeWithDefaultData = (mind: any) => {
    console.log("Initializing with default mind map data");
    const defaultData = {
      id: "root",
      topic: "New Mind Map",
      children: []
    };
    
    if (mind.init) mind.init(defaultData);
  };

  // Function to generate summaries for nodes and their children
  const generateNodeSummary = (node: any) => {
    if (!node || !node.topic) return;
    
    // Show toast to indicate summary generation started
    toast({
      title: "Generating Summary",
      description: "Creating summary for the selected node...",
      duration: 3000,
    });
    
    // Build a text representation of the node and its children
    const buildNodeText = (node: any, depth = 0): string => {
      if (!node || !node.topic) return '';
      
      // Create indentation based on depth
      const indent = '  '.repeat(depth);
      
      // Start with the current node's topic
      let text = `${indent}- ${node.topic.replace(/\n/g, ' ')}\n`;
      
      // Add children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          text += buildNodeText(child, depth + 1);
        });
      }
      
      return text;
    };
    
    // Get the text representation of the node and its children
    const nodeText = buildNodeText(node);
    
    // Set the summary (normally you might want to use an AI service here)
    setSummary(nodeText);
    setShowSummary(true);
    
    // Display the summary in a toast notification
    toast({
      title: "Node Summary",
      description: nodeText.length > 100 ? nodeText.substring(0, 100) + "..." : nodeText,
      duration: 5000,
    });
    
    console.log("Generated summary for node:", node.topic);
    console.log("Summary content:", nodeText);
  };

  // Handle centering the mind map
  const handleCenter = () => {
    if (mindMapRef.current && mindMapRef.current.toCenter) {
      mindMapRef.current.toCenter();
    }
  };

  // Zoom controls - updated to use our custom zoom functions
  const handleZoomIn = () => {
    if (mindMapRef.current) {
      customZoomIn(mindMapRef.current);
    }
  };

  const handleZoomOut = () => {
    if (mindMapRef.current) {
      customZoomOut(mindMapRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mind Map Container */}
      <div ref={containerRef} className="flex-1 border rounded-lg overflow-hidden bg-white" />
      
      {/* Controls - Only show once the mind map is ready */}
      {isReady && (
        <div className="flex justify-center items-center gap-2 p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCenter}
            className="flex items-center"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;
