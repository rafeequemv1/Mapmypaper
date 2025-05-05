
import { useEffect } from "react";

export const useMermaidInit = (direction: "TB" | "LR" = "TB") => {
  // This is now a no-op function since we're removing Mermaid
  useEffect(() => {
    // No initialization needed anymore
    
    // Add custom styles for flowcharts
    const style = document.createElement('style');
    style.innerHTML = `
      /* Custom node colors for classes */
      .node.class-1 rect { fill: #E5DEFF !important; stroke: #8B5CF6 !important; }
      .node.class-2 rect { fill: #D3E4FD !important; stroke: #0EA5E9 !important; }
      .node.class-3 rect { fill: #FDE1D3 !important; stroke: #F97316 !important; }
      .node.class-4 rect { fill: #F2FCE2 !important; stroke: #22C55E !important; }
      .node.class-5 rect { fill: #FFDEE2 !important; stroke: #EF4444 !important; }
      .node.class-6 rect { fill: #F1F0FB !important; stroke: #D946EF !important; }
      .node.class-7 rect { fill: #FEF7CD !important; stroke: #F59E0B !important; }
    `;
    document.head.appendChild(style);
    
    // Clean up function to remove style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, [direction]);
};

export default useMermaidInit;
