
import React, { useEffect, useRef, useState } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";

interface MarkMapViewerProps {
  mindMap: MindElixirInstance | null;
  className?: string;
}

// Convert MindElixir data to Markmap format
const transformMindElixirToMarkmap = (node: any): any => {
  if (!node) return null;
  
  // Create the markmap node with the topic as name
  const markmapNode: any = {
    t: node.topic || 'Unknown',
  };
  
  // Add children if they exist
  if (node.children && node.children.length > 0) {
    markmapNode.c = node.children.map((child: any) => 
      transformMindElixirToMarkmap(child)
    );
  }
  
  return markmapNode;
};

// Generate markdown from MindElixir data
const generateMarkdownFromMindElixir = (mindMap: MindElixirInstance): string => {
  if (!mindMap) return "# No Mind Map Data Available";
  
  const data = mindMap.getData();
  if (!data || !data.nodeData) return "# Error Loading Mind Map Data";
  
  // Convert to markdown recursively
  const convertToMarkdown = (node: any, level = 1): string => {
    if (!node) return "";
    
    // Create heading based on level (root is h1, children are h2, etc.)
    let markdown = "#".repeat(Math.min(level, 6)) + " " + (node.topic || "Untitled") + "\n\n";
    
    // Add children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        markdown += convertToMarkdown(child, level + 1);
      });
    }
    
    return markdown;
  };
  
  return convertToMarkdown(data.nodeData);
};

const MarkMapViewer: React.FC<MarkMapViewerProps> = ({ mindMap, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    if (!mindMap) return;
    
    // Generate markdown from mind map data
    const md = generateMarkdownFromMindElixir(mindMap);
    setMarkdown(md);
    
    // Transform markdown to markmap data
    const transformer = new Transformer();
    const { root } = transformer.transform(md);
    
    // Create markmap
    if (svgRef.current) {
      // Clear existing content
      svgRef.current.innerHTML = '';
      
      // Create and render markmap
      const markmap = Markmap.create(svgRef.current, {
        autoFit: true,
        zoom: true,
        color: (node: any) => {
          // Catppuccin-inspired color scheme
          const colors = [
            '#dd7878', '#ea76cb', '#8839ef', '#e64553', 
            '#fe640b', '#df8e1d', '#40a02b', '#209fb5', 
            '#1e66f5', '#7287fd', '#ea81bb', '#dd7878', 
            '#4699d9', '#fe640b', '#6dc7be', '#a5adcb'
          ];
          // Use node depth to determine color
          const depth = node.depth || 0;
          return colors[depth % colors.length];
        }
      }, root);
      
      toast({
        title: "Markmap View Loaded",
        description: "Viewing mind map in Markmap format"
      });
    }
  }, [mindMap, toast]);
  
  return (
    <div className={`w-full h-full bg-white ${className}`}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default MarkMapViewer;
