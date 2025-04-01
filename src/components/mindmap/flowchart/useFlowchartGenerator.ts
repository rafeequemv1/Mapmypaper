import { useState, useEffect } from 'react';
import { MindElixirData } from 'mind-elixir/dist/mindelixir.d';

const generateMermaidDiagram = (mindMapData: MindElixirData): string => {
  let mermaidString = 'graph LR\n';

  const addNode = (node: any, parentId: string | null) => {
    const nodeId = node.id.replace(/-/g, '');
    mermaidString += `  ${nodeId}["${node.topic}"]\n`;

    if (parentId) {
      mermaidString += `  ${parentId} --> ${nodeId}\n`;
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => addNode(child, nodeId));
    }
  };

  if (mindMapData?.nodeData) {
    addNode(mindMapData.nodeData, null);
  }

  return mermaidString;
};

const useFlowchartGenerator = (mindMapData: MindElixirData | null) => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mindMapData) {
      setMermaidCode('');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const diagram = generateMermaidDiagram(mindMapData);
      setMermaidCode(diagram);
    } catch (e: any) {
      setError(e.message || 'Failed to generate flowchart');
    } finally {
      setLoading(false);
    }
  }, [mindMapData]);

  return { mermaidCode, loading, error };
};

export default useFlowchartGenerator;

