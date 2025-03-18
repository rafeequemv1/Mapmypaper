
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";

// Sample mind map data
export const createSampleMindMapData = (): MindElixirData => {
  return {
    nodeData: {
      id: 'root',
      topic: 'Research Paper Title',
      style: { background: '#8B5CF6' }, // Vivid purple for root node
      children: [
        {
          id: 'bd1',
          topic: 'Introduction',
          direction: 0 as const,
          style: { background: '#0EA5E9' }, // Ocean blue
          children: [
            { id: 'bd1-1', topic: 'Problem Statement', style: { background: '#D3E4FD' } }, // Soft blue
            { id: 'bd1-2', topic: 'Research Objectives', style: { background: '#D3E4FD' } } // Soft blue
          ]
        },
        {
          id: 'bd2',
          topic: 'Methodology',
          direction: 0 as const,
          style: { background: '#F97316' }, // Bright orange
          children: [
            { id: 'bd2-1', topic: 'Data Collection', style: { background: '#FEC6A1' } }, // Soft orange
            { id: 'bd2-2', topic: 'Analysis Techniques', style: { background: '#FEC6A1' } } // Soft orange
          ]
        },
        {
          id: 'bd3',
          topic: 'Results',
          direction: 1 as const,
          style: { background: '#D946EF' }, // Magenta pink
          children: [
            { id: 'bd3-1', topic: 'Key Finding 1', style: { background: '#FFDEE2' } }, // Soft pink
            { id: 'bd3-2', topic: 'Key Finding 2', style: { background: '#FFDEE2' } }, // Soft pink
          ]
        },
        {
          id: 'bd4',
          topic: 'Conclusion',
          direction: 1 as const,
          style: { background: '#10B981' }, // Green
          children: [
            { id: 'bd4-1', topic: 'Summary', style: { background: '#F2FCE2' } }, // Soft green
            { id: 'bd4-2', topic: 'Future Work', style: { background: '#F2FCE2' } } // Soft green
          ]
        }
      ]
    }
  };
};

// Create mind map configuration
export const createMindMapOptions = (containerRef: HTMLDivElement) => {
  return {
    el: containerRef,
    direction: 1 as const,
    draggable: true,
    editable: true,
    contextMenu: true,
    tools: {
      zoom: true,
      create: true,
      edit: true,
    },
    theme: {
      name: 'colorful',
      background: '#f8f9fa',
      color: '#333',
      // Define a colorful palette for new nodes
      palette: [
        '#8B5CF6', // Vivid purple
        '#D946EF', // Magenta pink
        '#F97316', // Bright orange
        '#0EA5E9', // Ocean blue
        '#10B981', // Green
        '#6366F1', // Indigo
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F59E0B', // Amber
        '#6D28D9'  // Purple
      ],
      // Fixed cssVar to match the expected type format
      cssVar: {
        '--main-color': '#8E9196',
        '--main-bgcolor': '#f8f9fa',
        '--color': '#333',
        '--bgcolor': '#fff',
        '--selected': 'rgba(139, 92, 246, 0.3)',
        '--root-color': '#8B5CF6',
        '--root-bgcolor': '#fff',
        '--root-border-color': '#8B5CF6',
        '--second-color': '#0EA5E9',
        '--second-bgcolor': '#fff',
        '--second-border-color': '#0EA5E9',
        '--third-color': '#F97316',
        '--third-bgcolor': '#fff',
        '--third-border-color': '#F97316',
        '--line-color': '#8E9196'
      }
    },
    nodeMenu: true,
    autoFit: true,
  };
};

// Calculate the best scale for the mind map
export const calculateMindMapScale = (container: HTMLDivElement, mindMapRoot: HTMLElement) => {
  // Get dimensions
  const containerRect = container.getBoundingClientRect();
  const rootRect = mindMapRoot.getBoundingClientRect();
  
  // Calculate the scale needed to fit content
  const scaleX = (containerRect.width * 0.9) / rootRect.width;
  const scaleY = (containerRect.height * 0.9) / rootRect.height;
  
  // Don't scale up, only down if needed
  return Math.min(scaleX, scaleY, 1);
};

// Initialize the mind map
export const initializeMindMap = (
  containerRef: HTMLDivElement,
  setMindMap: (instance: MindElixirInstance) => void
): MindElixirInstance => {
  const options = createMindMapOptions(containerRef);
  const mind = new MindElixir(options);
  
  // Install the node-menu-neo plugin
  mind.install(nodeMenu);
  
  // Initialize with sample data
  mind.init(createSampleMindMapData());
  
  // Use the callback to set the mind map instance
  // This avoids directly modifying the ref.current which is read-only
  setMindMap(mind);
  
  return mind;
};
