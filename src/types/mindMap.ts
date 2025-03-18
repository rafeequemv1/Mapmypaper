
import { MindElixirData } from "mind-elixir";
import { ExtractedImage } from "@/hooks/usePdfProcessor";

export interface ExtendedNodeData {
  id: string;
  topic: string;
  image?: {
    src: string;
    width?: number;
    height?: number;
  };
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
  extractedImages?: ExtractedImage[];
  selectedNode?: string;
}
