
import React from "react";

interface FallbackDiagramProps {
  code: string;
}

const FallbackDiagram: React.FC<FallbackDiagramProps> = ({ code }) => {
  // Extract nodes for fallback display
  const nodeMatches = code.match(/([A-Za-z0-9_-]+)(?:\[|\(|\{)/g) || [];
  const nodes = Array.from(new Set(nodeMatches.map(n => n.replace(/[\[\(\{]$/, ""))));
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
        </g>
        <text x="400" y="30" textAnchor="middle" fontFamily="Arial" fontSize="18" fontWeight="bold">
          Simplified Flowchart (Fallback Mode)
        </text>
        <text x="400" y="570" textAnchor="middle" fontFamily="Arial" fontSize="14" fill="#EF4444">
          Note: Using simplified view due to rendering issues
        </text>
      </svg>
    </div>
  );
};

export default FallbackDiagram;
