
// Add or update the MindElixir interface to include toJSON method
declare module 'mind-elixir' {
  export interface MindElixirData {
    nodeData: {
      id: string;
      topic: string;
      children?: MindElixirData['nodeData'][];
      [key: string]: any;
    };
    linkData?: {
      source: string;
      target: string;
      label?: string;
    }[];
  }

  export interface MindElixirInstance {
    init: (options: any) => void;
    getData: () => MindElixirData;
    setData: (data: MindElixirData) => void;
    expandNode: (id: string) => void;
    collapseNode: (id: string) => void;
    toJSON: () => MindElixirData;
    exportImg: (cb: (blob: Blob) => void) => void;
    exportPdf: (callback: (pdf: any) => void) => void;
    getAllDataWithImage: () => any;
    getAllData: () => MindElixirData;
    refresh: () => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeFromDom: () => void;
    container: HTMLElement;
  }

  export interface MindElixirConstructor {
    new (options: any): MindElixirInstance;
  }
  
  const MindElixir: MindElixirConstructor;
  export default MindElixir;
}
