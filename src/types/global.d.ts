
import { MindElixirInstance } from "mind-elixir";

declare global {
  interface Window {
    mindElixirInstance: MindElixirInstance;
    mermaid: any;
  }
}

export {};
