
export const defaultFlowchart = `flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    
    class A,C,D default
    class B decision`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with flowchart directive and LR direction
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else if (cleaned.startsWith("flowchart TD")) {
    cleaned = cleaned.replace("flowchart TD", "flowchart LR");
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip special lines
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end' ||
        line.trim().startsWith('class')) {
      return line;
    }
    
    // Fix arrows and nodes
    let processedLine = line.replace(/-+>/g, "-->");
    processedLine = processedLine.replace(/(\b\w+)-(\w+\b)(?!\]|\)|\})/g, "$1_$2");
    processedLine = processedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
    processedLine = processedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
    processedLine = processedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
    
    // Replace hyphens in node text with spaces
    for (let i = 0; i < 3; i++) {
      processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, (_, p1, p2) => `[${p1} ${p2}]`);
      processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, (_, p1, p2) => `(${p1} ${p2})`);
      processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, (_, p1, p2) => `{${p1} ${p2}}`);
    }
    
    return processedLine;
  });
  
  // Add color classes if they don't exist
  let result = processedLines.join('\n');
  
  if (!result.includes('classDef')) {
    result += `
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    classDef danger fill:#FFDEE2,stroke:#EF4444,stroke-width:2px
    classDef info fill:#D3E4FD,stroke:#3B82F6,stroke-width:2px
    classDef neutral fill:#FDE1D3,stroke:#F97316,stroke-width:2px`;
  }
  
  return result;
};
