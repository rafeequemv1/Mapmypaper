
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";

// Sample mind map data
export const createSampleMindMapData = (): MindElixirData => {
  return {
    nodeData: {
      id: 'root',
      topic: 'Research Paper Title',
      children: [
        {
          id: 'bd1',
          topic: 'Introduction',
          direction: 0 as const,
          children: [
            { id: 'bd1-1', topic: 'Problem Statement' },
            { id: 'bd1-2', topic: 'Research Objectives' }
          ]
        },
        {
          id: 'bd2',
          topic: 'Methodology',
          direction: 0 as const,
          children: [
            { id: 'bd2-1', topic: 'Data Collection' },
            { id: 'bd2-2', topic: 'Analysis Techniques' }
          ]
        },
        {
          id: 'bd3',
          topic: 'Results',
          direction: 1 as const,
          children: [
            { id: 'bd3-1', topic: 'Key Finding 1' },
            { id: 'bd3-2', topic: 'Key Finding 2' },
          ]
        },
        {
          id: 'bd4',
          topic: 'Conclusion',
          direction: 1 as const,
          children: [
            { id: 'bd4-1', topic: 'Summary' },
            { id: 'bd4-2', topic: 'Future Work' }
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
      name: 'gray',
      background: '#f5f5f5',
      color: '#333',
      palette: [],
      cssVar: {},
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
  
  // Set the reference
  setMindMap(mind);
  
  return mind;
};
