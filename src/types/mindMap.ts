
import { MindElixirData } from "mind-elixir";

export interface ExtendedNodeData {
  id: string;
  topic: string;
  style?: {
    background?: string;
    color?: string;
    [key: string]: any;
  };
  children?: ExtendedNodeData[];
  direction?: 0 | 1;
}

export interface MindMapStorage {
  mindMapData?: MindElixirData;
  extractedText?: string;
  selectedNode?: string;
}
