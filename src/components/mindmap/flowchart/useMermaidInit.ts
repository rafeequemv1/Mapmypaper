
import { useEffect } from "react";
import mermaid from "mermaid";

export const useMermaidInit = (direction: "TB" | "LR" = "TB") => {
  // Initialize mermaid with safe configuration
  useEffect(() => {
    // Initialize with base configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        diagramPadding: 8,
        nodeSpacing: 50,
        rankSpacing: 70,
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      mindmap: {
        padding: 16,
        useMaxWidth: false // Use correct property
      },
      // Add custom flowchart styles
      themeVariables: {
        primaryColor: '#8B5CF6',
        primaryTextColor: '#333',
        primaryBorderColor: '#6E59A5',
        secondaryColor: '#0EA5E9',
        secondaryTextColor: '#333',
        secondaryBorderColor: '#0987A0',
        tertiaryColor: '#F97316',
        tertiaryTextColor: '#333',
        tertiaryBorderColor: '#C2410C',
        noteBkgColor: '#FEF7CD',
        noteTextColor: '#333',
        noteBorderColor: '#F59E0B',
        lineColor: '#64748B',
      },
      // TypeScript doesn't know about this yet
      logLevel: 3 // Enables warning logs for debugging
    });
    
    // For flowcharts, apply the direction through the general mermaid code
    if (direction === "LR") {
      // Force horizontal layout for flowcharts using the proper syntax that works with mermaid
      document.querySelectorAll('.mermaid').forEach(el => {
        if (el.textContent && el.textContent.trim().startsWith('flowchart')) {
          if (!el.textContent.includes('flowchart LR')) {
            el.textContent = el.textContent.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
          }
        }
      });
    }
    
    // Add custom styles for prettier flowcharts
    const style = document.createElement('style');
    style.innerHTML = `
      .flowchart-node rect {
        fill-opacity: 0.9 !important;
        rx: 10px;
        ry: 10px; 
      }
      .edgeLabel {
        background-color: white !important;
        padding: 2px 4px !important;
        border-radius: 4px !important;
      }
      
      /* Custom node colors for classes */
      .node.class-1 rect { fill: #E5DEFF !important; stroke: #8B5CF6 !important; }
      .node.class-2 rect { fill: #D3E4FD !important; stroke: #0EA5E9 !important; }
      .node.class-3 rect { fill: #FDE1D3 !important; stroke: #F97316 !important; }
      .node.class-4 rect { fill: #F2FCE2 !important; stroke: #22C55E !important; }
      .node.class-5 rect { fill: #FFDEE2 !important; stroke: #EF4444 !important; }
      .node.class-6 rect { fill: #FEF7CD !important; stroke: #F59E0B !important; }
      .node.class-7 rect { fill: #F1F0FB !important; stroke: #D946EF !important; }
    `;
    document.head.appendChild(style);
  }, [direction]);
};

export default useMermaidInit;
