import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";

// Sample mind map data
export const createSampleMindMapData = (): MindElixirData => {
  return {
    nodeData: {
      id: 'root',
      topic: 'Research Paper Title',
      style: { background: '#E5DEFF', color: '#000000' }, // Soft purple for root node
      children: [
        {
          id: 'bd1',
          topic: 'Introduction',
          direction: 0 as const,
          style: { background: '#D3E4FD', color: '#000000' }, // Soft blue
          children: [
            { id: 'bd1-1', topic: 'Problem Statement', style: { background: '#D3E4FD', color: '#000000' } }, // Soft blue
            { id: 'bd1-2', topic: 'Research Objectives', style: { background: '#D3E4FD', color: '#000000' } } // Soft blue
          ]
        },
        {
          id: 'bd2',
          topic: 'Methodology',
          direction: 0 as const,
          style: { background: '#FEC6A1', color: '#000000' }, // Soft orange
          children: [
            { id: 'bd2-1', topic: 'Data Collection', style: { background: '#FEC6A1', color: '#000000' } }, // Soft orange
            { id: 'bd2-2', topic: 'Analysis Techniques', style: { background: '#FEC6A1', color: '#000000' } } // Soft orange
          ]
        },
        {
          id: 'bd3',
          topic: 'Results',
          direction: 1 as const,
          style: { background: '#FFDEE2', color: '#000000' }, // Soft pink
          children: [
            { id: 'bd3-1', topic: 'Key Finding 1', style: { background: '#FFDEE2', color: '#000000' } }, // Soft pink
            { id: 'bd3-2', topic: 'Key Finding 2', style: { background: '#FFDEE2', color: '#000000' } }, // Soft pink
          ]
        },
        {
          id: 'bd4',
          topic: 'Conclusion',
          direction: 1 as const,
          style: { background: '#F2FCE2', color: '#000000' }, // Soft green
          children: [
            { id: 'bd4-1', topic: 'Summary', style: { background: '#F2FCE2', color: '#000000' } }, // Soft green
            { id: 'bd4-2', topic: 'Future Work', style: { background: '#F2FCE2', color: '#000000' } } // Soft green
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
      color: '#000000', // Black text for all nodes
      // Define a colorful but light palette for new nodes
      palette: [
        '#E5DEFF', // Soft purple
        '#D3E4FD', // Soft blue
        '#FEC6A1', // Soft orange
        '#FFDEE2', // Soft pink
        '#F2FCE2', // Soft green
        '#FEF7CD', // Soft yellow
        '#FDE1D3', // Soft peach
        '#F1F0FB', // Soft gray
      ],
      // CSS variables to control the appearance
      cssVar: {
        '--main-color': '#000000', // Black text
        '--main-bgcolor': '#f8f9fa',
        '--color': '#000000', // Black text
        '--bgcolor': '#fff',
        '--selected': 'rgba(139, 92, 246, 0.3)',
        '--root-color': '#000000', // Black text for root node
        '--root-bgcolor': '#E5DEFF', // Soft purple for root node
        '--root-border-color': '#E5DEFF', // Border matches background
        '--second-color': '#000000', // Black text for second level nodes
        '--second-bgcolor': '#D3E4FD', // Soft blue for second level
        '--second-border-color': '#D3E4FD', // Border matches background
        '--third-color': '#000000', // Black text for third level nodes
        '--third-bgcolor': '#FEC6A1', // Soft orange for third level
        '--third-border-color': '#FEC6A1', // Border matches background
        '--line-color': '#CCCCCC' // Light gray for lines
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
