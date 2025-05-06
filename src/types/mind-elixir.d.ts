
// Type definitions for mind-elixir library
declare module 'mind-elixir' {
  export interface NodeObj {
    id: string;
    topic: string;
    children?: NodeObj[];
    direction?: number;
    expanded?: boolean;
    root?: boolean;
    image?: {
      url: string;
      width: number;
      height: number;
    };
    [key: string]: any;
  }

  export interface MindElixirData {
    nodeData: NodeObj;
    linkData?: any[];
  }

  export interface EventMap {
    selectNode: (node: NodeObj) => void;
    expandNode: (node: NodeObj) => void;
    hideNode: (node: NodeObj) => void;
    contextMenu: (node: NodeObj) => void;
    nodeClick: (node: NodeObj) => void;
    [key: string]: any;
  }

  export interface Bus {
    addListener: <T extends keyof EventMap>(event: T, callback: EventMap[T]) => void;
    removeListener: <T extends keyof EventMap>(event: T, callback?: EventMap[T]) => void;
    fire: <T extends keyof EventMap>(event: T, ...args: any[]) => void;
  }

  export interface MindElixirOptions {
    el: HTMLElement;
    direction?: number;
    data?: MindElixirData;
    draggable?: boolean;
    contextMenu?: boolean;
    toolBar?: boolean;
    nodeMenu?: boolean;
    keypress?: boolean;
    allowPrevRoot?: boolean;
    locale?: string;
    overflowHidden?: boolean;
    primaryLinkStyle?: number;
    primaryNodeHorizontalGap?: number;
    primaryNodeVerticalGap?: number;
    contextMenuOption?: {
      focus?: boolean;
      link?: boolean;
      extend?: Array<{
        name: string;
        onclick: (node: NodeObj, instance: MindElixirInstance) => void;
      }>;
    };
    before?: {
      insertSibling?: (el: HTMLElement, obj: NodeObj) => boolean;
      addChild?: (el: HTMLElement, obj: NodeObj) => boolean;
    };
    theme?: {
      name: string;
      type: 'light' | 'dark';
      background: string;
      color: string;
      palette: string[];
      cssVar: Record<string, string>;
    };
    [key: string]: any;
  }

  export interface MindElixirInstance {
    bus: Bus;
    currentNode: { nodeObj: NodeObj } | null;
    currentLink: any;
    data: MindElixirData;
    direction: number;
    initOptions: MindElixirOptions;
    init: (data?: MindElixirData) => void;
    getData: (format?: string) => any;
    refresh: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    install: (plugin: any) => void;
    exportImg: (type?: string) => string;
    exportPng: () => Promise<Blob>;
    exportSvg: () => Blob;
    expandAll: () => void;
    collapseAll: () => void;
    toCenter: () => void;
    removeEventListener: () => void;
    [key: string]: any;
  }

  // Static members of the MindElixir constructor
  export interface MindElixirStatic {
    new(options: MindElixirOptions): MindElixirInstance;
    LEFT: 0;
    RIGHT: 1;
    SIDE: 2;
    new(options: MindElixirOptions): MindElixirInstance;
  }

  const MindElixir: MindElixirStatic;
  export default MindElixir;
}

declare module '@mind-elixir/node-menu' {
  const nodeMenu: any;
  export default nodeMenu;
}

declare module '@mind-elixir/node-menu-neo' {
  const nodeMenu: any;
  export default nodeMenu;
}
