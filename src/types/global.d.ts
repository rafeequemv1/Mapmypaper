
interface Window {
  // Add any custom properties to the Window interface
  // Empty for now as we've removed $crisp from the codebase
}

// Define module to avoid TypeScript errors
declare module 'mind-elixir' {
  export interface MindElixirData {
    nodeData: {
      id: string;
      topic: string;
      root?: boolean;
      children?: MindElixirData['nodeData'][];
      direction?: 0 | 1;
      expanded?: boolean;
      [key: string]: any;
    };
    linkData?: {
      id: string;
      from: string;
      to: string;
      label?: string;
      [key: string]: any;
    }[];
  }

  export interface MindElixirInstance {
    init: (data: MindElixirData) => void;
    refresh: () => void;
    toJSON: () => MindElixirData;
    getAllDataString: () => string;
    getAllData: () => MindElixirData;
    getNodeById: (id: string) => any;
    traverseDF: (callback: (node: any) => void) => void;
    expandNode: (node: any) => void;
    collapseNode: (node: any) => void;
    initSide: () => void;
    layout: () => void;
    linkDiv: any;
    currentNode: any;
    currentLink: any;
    inputDiv: any;
    selectNode: (node: any) => void;
    cancelSide: () => void;
    createLink: (from: string, to: string) => void;
    removeLink: (id: string) => void;
    removeNode: (id: string) => void;
    addChild: (topic: string) => void;
    insertSibling: (topic: string) => void;
    insertBefore: (topic: string) => void;
    moveNode: (from: string, to: string) => void;
    moveUpNode: () => void;
    moveDownNode: () => void;
    beginEdit: (id?: string) => void;
    updateNodeStyle: (nodeObj: any) => void;
    updateNodeTags: (nodeObj: any) => void;
    updateNodeTopics: (nodeObj: any) => void;
    updateNodeHyperLink: (nodeObj: any) => void;
    updateNodeNotes: (nodeObj: any) => void;
    updateNodeIcons: (nodeObj: any) => void;
    exportSvg: () => Blob;
    exportPng: () => Promise<Blob>;
    container?: HTMLElement;
    install: (plugin: any) => void;
  }

  interface MindElixirOptions {
    el: HTMLElement;
    direction?: 1 | 2 | 0 | 3;
    data?: MindElixirData;
    draggable?: boolean;
    contextMenu?: boolean;
    toolBar?: boolean | string[];
    nodeMenu?: boolean;
    keypress?: boolean;
    locale?: string;
    mainNodeVerticalGap?: number;
    mainNodeHorizontalGap?: number;
    childNodeGap?: number;
    mainNodeDiameter?: number;
    childNodeRadius?: number;
    main?: {
      message: string;
      link: string;
      button: string;
    };
    theme?: {
      name: string;
      type: 'dark' | 'light';
      background: string;
      color: string;
      palette: string[];
      cssVar: Record<string, string>;
    };
    tools?: {
      zoom?: boolean;
      create?: boolean;
      edit?: boolean;
    };
    beforeRender?: (node: any, tpc: HTMLElement, level: number) => void;
    autoFit?: boolean;
  }

  export default class MindElixir {
    constructor(options: MindElixirOptions);
    init: (data: MindElixirData) => void;
    refresh: () => void;
    getAllDataString: () => string;
    getAllData: () => MindElixirData;
    getNodeById: (id: string) => any;
    traverseDF: (callback: (node: any) => void) => void;
    expandNode: (node: any) => void;
    collapseNode: (node: any) => void;
    initSide: () => void;
    layout: () => void;
    linkDiv: any;
    currentNode: any;
    currentLink: any;
    inputDiv: any;
    selectNode: (node: any) => void;
    cancelSide: () => void;
    createLink: (from: string, to: string) => void;
    removeLink: (id: string) => void;
    removeNode: (id: string) => void;
    addChild: (topic: string) => void;
    insertSibling: (topic: string) => void;
    insertBefore: (topic: string) => void;
    moveNode: (from: string, to: string) => void;
    moveUpNode: () => void;
    moveDownNode: () => void;
    beginEdit: (id?: string) => void;
    updateNodeStyle: (nodeObj: any) => void;
    updateNodeTags: (nodeObj: any) => void;
    updateNodeTopics: (nodeObj: any) => void;
    updateNodeHyperLink: (nodeObj: any) => void;
    updateNodeNotes: (nodeObj: any) => void;
    updateNodeIcons: (nodeObj: any) => void;
    exportSvg: () => Blob;
    exportPng: () => Promise<Blob>;
    container?: HTMLElement;
    install: (plugin: any) => void;
  }
}

declare module '@mind-elixir/node-menu-neo' {
  const nodeMenu: {
    menus: (node: any, mind: any) => {name: string; onclick: () => void}[];
  };
  export default nodeMenu;
}
