
import React from "react";

interface FallbackDiagramProps {
  code: string;
}

const FallbackDiagram: React.FC<FallbackDiagramProps> = ({ code }) => {
  // Extract nodes for display
  const nodeMatches = code.match(/([A-Za-z0-9_-]+)(?:\[|\(|\{)/g) || [];
  const nodes = Array.from(new Set(nodeMatches.map(n => n.replace(/[\[\(\{]$/, ""))));
  
  // Extract connections if possible
  const connections: { from: string, to: string, label?: string }[] = [];
  const connectionRegex = /([A-Za-z0-9_-]+)\s*--(?:-|>)\s*(?:\|([^|]+)\|\s*)?([A-Za-z0-9_-]+)/g;
  let match;
  
  // Use the regex to find connections
  const codeString = typeof code === 'string' ? code : '';
  while ((match = connectionRegex.exec(codeString)) !== null) {
    connections.push({
      from: match[1],
      to: match[3],
      label: match[2]
    });
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
          </marker>
        </defs>
        <g transform="translate(50, 50)">
          {nodes.map((node, i) => (
            <g key={node} transform={`translate(${(i % 3) * 260}, ${Math.floor(i / 3) * 100})`}>
              <rect width="200" height="60" rx="15" ry="15"
                fill={["#F2FCE2", "#FEF7CD", "#E5DEFF", "#D3E4FD", "#FDE1D3"][i % 5]}
                stroke={["#22C55E", "#F59E0B", "#8B5CF6", "#3B82F6", "#F97316"][i % 5]}
                strokeWidth="2"
              />
              <text x="100" y="35" textAnchor="middle" fontFamily="Arial" fontSize="14">{node}</text>
            </g>
          ))}
          
          {/* Draw connections between nodes if we have position data */}
          {connections.map((conn, i) => {
            const fromIndex = nodes.indexOf(conn.from);
            const toIndex = nodes.indexOf(conn.to);
            
            if (fromIndex === -1 || toIndex === -1) return null;
            
            const fromX = (fromIndex % 3) * 260 + 100;
            const fromY = Math.floor(fromIndex / 3) * 100 + 30;
            
            const toX = (toIndex % 3) * 260 + 100;
            const toY = Math.floor(toIndex / 3) * 100 + 30;
            
            // Calculate a midpoint with slight curve
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 + 20;
            
            return (
              <g key={`conn-${i}`}>
                <path 
                  d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {conn.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect 
                      x="-30" y="-10" 
                      width="60" height="20" 
                      rx="5" ry="5"
                      fill="white" 
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                    <text 
                      x="0" y="5" 
                      textAnchor="middle" 
                      fontFamily="Arial" 
                      fontSize="10"
                    >
                      {conn.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        <text x="400" y="30" textAnchor="middle" fontFamily="Arial" fontSize="18" fontWeight="bold">
          Simplified Flowchart
        </text>
      </svg>
    </div>
  );
};

export default FallbackDiagram;
