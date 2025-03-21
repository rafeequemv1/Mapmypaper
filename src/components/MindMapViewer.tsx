import React, { useState, useEffect, useRef, useCallback } from "react";
import MindElixir from "mind-elixir";
import { MindElixirInstance, NodeObj } from "mind-elixir/dist/types/index";
import { useTheme } from "next-themes";
import { useGlobalStore } from "@/store/globalStore";
import { ContextMenu } from "@/components/ui/context-menu";
import MindMapContextMenu from "@/components/mindmap/MindMapContextMenu";
import { useToast } from "@/hooks/use-toast";

interface MindMapViewerProps {
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  explainText?: string;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({
  onMindMapReady,
  explainText,
  onExplainText,
  onRequestOpenChat,
}) => {
  const [mindElixirData, setMindElixirData] = useState(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const mindElixir = useRef<MindElixirInstance | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const globalStore = useGlobalStore();

  useEffect(() => {
    // Load data from local storage on component mount
    const storedData = localStorage.getItem("mindElixirData");
    if (storedData) {
      setMindElixirData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    // Initialize MindElixir when the component mounts
    if (!container.current) {
      return;
    }

    const options = {
      el: container.current,
      newTopicName: "New Node",
      direction: MindElixir.LEFT,
      locale: "en",
      theme: theme === "dark" ? "dark" : "light",
      readonly: isReadOnly,
      //   overflowHidden: true,
      //   primaryColor: "#000000",
      //   nodeMenu: true,
      contextMenu: true,
      contextMenuOption: {
        name: "copy",
        onclick: () => {
          console.log("copy");
        },
      },
      nodeMenuOption: {
        addChild: "Add Child",
        deleteNode: "Delete",
        focusNode: "Focus",
        expandNode: "Expand",
        collapseNode: "Collapse",
      },
      //   mobileLayout: true,
      //   draggable: true,
      keypress: true,
      before: {
        addChild: (newNode, node) => {
          console.log("addChild", newNode, node);
          return true;
        },
        deleteNode: (node, parent, isRoot) => {
          console.log("deleteNode", node, parent, isRoot);
          return true;
        },
        moveNode: (node, newParent, originParent, sibling) => {
          console.log("moveNode", node, newParent, originParent, sibling);
          return true;
        },
        //   focusNode: (node) => {
        //     console.log("focusNode", node);
        //     return true;
        //   },
        //   selectNode: (node) => {
        //     console.log("selectNode", node);
        //     return true;
        //   },
      },
      //   validateTopic: (topic) => {
      //     console.log("validateTopic", topic);
      //     return true;
      //   },
    };

    mindElixir.current = new MindElixir(options);

    if (mindElixirData) {
      mindElixir.current.load(mindElixirData);
    } else {
      mindElixir.current.new("Main Topic");
    }

    mindElixir.current. bus.addListener("node_click", (node, topic, taskId) => {
      console.log("node_click", node, topic, taskId);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("contextmenu", (node, topic, taskId) => {
      console.log("contextmenu", node, topic, taskId);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("operation", (operation) => {
      console.log("operation", operation);
      localStorage.setItem(
        "mindElixirData",
        JSON.stringify(mindElixir.current.getData())
      );
    });

    mindElixir.current. bus.addListener("selectNode", (node) => {
      console.log("selectNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("expandNode", (node) => {
      console.log("expandNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("collapseNode", (node) => {
      console.log("collapseNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("nodeDrop", (node) => {
      console.log("nodeDrop", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("renameNode", (node) => {
      console.log("renameNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("addChildNode", (node) => {
      console.log("addChildNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("deleteNode", (node) => {
      console.log("deleteNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("moveNode", (node) => {
      console.log("moveNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("linkNodes", (node) => {
      console.log("linkNodes", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("unlinkNodes", (node) => {
      console.log("unlinkNodes", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("editorChange", (node) => {
      console.log("editorChange", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("undo", (node) => {
      console.log("undo", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("redo", (node) => {
      console.log("redo", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("showContextMenu", (node) => {
      console.log("showContextMenu", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("hideContextMenu", (node) => {
      console.log("hideContextMenu", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("fullscreen", (node) => {
      console.log("fullscreen", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("zoomIn", (node) => {
      console.log("zoomIn", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("zoomOut", (node) => {
      console.log("zoomOut", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("resetZoom", (node) => {
      console.log("resetZoom", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("focusNode", (node) => {
      console.log("focusNode", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("expandAll", (node) => {
      console.log("expandAll", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("collapseAll", (node) => {
      console.log("collapseAll", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("enableEdit", (node) => {
      console.log("enableEdit", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("disableEdit", (node) => {
      console.log("disableEdit", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("screenshot", (node) => {
      console.log("screenshot", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("exportSvg", (node) => {
      console.log("exportSvg", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("exportPng", (node) => {
      console.log("exportPng", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("exportJson", (node) => {
      console.log("exportJson", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("importJson", (node) => {
      console.log("importJson", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getJson", (node) => {
      console.log("getJson", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getData", (node) => {
      console.log("getData", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodeData", (node) => {
      console.log("getNodeData", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getRoot", (node) => {
      console.log("getRoot", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getParent", (node) => {
      console.log("getParent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getChildren", (node) => {
      console.log("getChildren", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getFirstChild", (node) => {
      console.log("getFirstChild", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getLastChild", (node) => {
      console.log("getLastChild", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNextSibling", (node) => {
      console.log("getNextSibling", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getPrevSibling", (node) => {
      console.log("getPrevSibling", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodes", (node) => {
      console.log("getNodes", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesData", (node) => {
      console.log("getNodesData", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithTopic", (node) => {
      console.log("getNodesDataWithTopic", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithId", (node) => {
      console.log("getNodesDataWithId", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithTag", (node) => {
      console.log("getNodesDataWithTag", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithIcon", (node) => {
      console.log("getNodesDataWithIcon", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithLink", (node) => {
      console.log("getNodesDataWithLink", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithLabel", (node) => {
      console.log("getNodesDataWithLabel", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithNote", (node) => {
      console.log("getNodesDataWithNote", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithImage", (node) => {
      console.log("getNodesDataWithImage", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithVideo", (node) => {
      console.log("getNodesDataWithVideo", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithAudio", (node) => {
      console.log("getNodesDataWithAudio", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithFile", (node) => {
      console.log("getNodesDataWithFile", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithTask", (node) => {
      console.log("getNodesDataWithTask", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithProgress", (node) => {
      console.log("getNodesDataWithProgress", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithPriority", (node) => {
      console.log("getNodesDataWithPriority", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithDeadline", (node) => {
      console.log("getNodesDataWithDeadline", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithAssignee", (node) => {
      console.log("getNodesDataWithAssignee", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithStatus", (node) => {
      console.log("getNodesDataWithStatus", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomData", (node) => {
      console.log("getNodesDataWithCustomData", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomStyle", (node) => {
      console.log("getNodesDataWithCustomStyle", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClass", (node) => {
      console.log("getNodesDataWithCustomClass", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomAttribute", (node) => {
      console.log("getNodesDataWithCustomAttribute", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomEvent", (node) => {
      console.log("getNodesDataWithCustomEvent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomMethod", (node) => {
      console.log("getNodesDataWithCustomMethod", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomProperty", (node) => {
      console.log("getNodesDataWithCustomProperty", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomVariable", (node) => {
      console.log("getNodesDataWithCustomVariable", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomConstant", (node) => {
      console.log("getNodesDataWithCustomConstant", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFunction", (node) => {
      console.log("getNodesDataWithCustomFunction", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClassMethod", (node) => {
      console.log("getNodesDataWithCustomClassMethod", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClassProperty", (node) => {
      console.log("getNodesDataWithCustomClassProperty", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClassVariable", (node) => {
      console.log("getNodesDataWithCustomClassVariable", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClassConstant", (node) => {
      console.log("getNodesDataWithCustomClassConstant", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomClassFunction", (node) => {
      console.log("getNodesDataWithCustomClassFunction", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomInterface", (node) => {
      console.log("getNodesDataWithCustomInterface", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomType", (node) => {
      console.log("getNodesDataWithCustomType", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomEnum", (node) => {
      console.log("getNodesDataWithCustomEnum", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDecorator", (node) => {
      console.log("getNodesDataWithCustomDecorator", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomAnnotation", (node) => {
      console.log("getNodesDataWithCustomAnnotation", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDirective", (node) => {
      console.log("getNodesDataWithCustomDirective", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomPipe", (node) => {
      console.log("getNodesDataWithCustomPipe", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomGuard", (node) => {
      console.log("getNodesDataWithCustomGuard", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomResolver", (node) => {
      console.log("getNodesDataWithCustomResolver", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSubscriber", (node) => {
      console.log("getNodesDataWithCustomSubscriber", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomInterceptor", (node) => {
      console.log("getNodesDataWithCustomInterceptor", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomMiddleware", (node) => {
      console.log("getNodesDataWithCustomMiddleware", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFilter", (node) => {
      console.log("getNodesDataWithCustomFilter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomValidator", (node) => {
      console.log("getNodesDataWithCustomValidator", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSerializer", (node) => {
      console.log("getNodesDataWithCustomSerializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDeserializer", (node) => {
      console.log("getNodesDataWithCustomDeserializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomConverter", (node) => {
      console.log("getNodesDataWithCustomConverter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFormatter", (node) => {
      console.log("getNodesDataWithCustomFormatter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomParser", (node) => {
      console.log("getNodesDataWithCustomParser", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomRenderer", (node) => {
      console.log("getNodesDataWithCustomRenderer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomComponent", (node) => {
      console.log("getNodesDataWithCustomComponent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDirective", (node) => {
      console.log("getNodesDataWithCustomDirective", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomPipe", (node) => {
      console.log("getNodesDataWithCustomPipe", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomGuard", (node) => {
      console.log("getNodesDataWithCustomGuard", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomResolver", (node) => {
      console.log("getNodesDataWithCustomResolver", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSubscriber", (node) => {
      console.log("getNodesDataWithCustomSubscriber", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomInterceptor", (node) => {
      console.log("getNodesDataWithCustomInterceptor", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomMiddleware", (node) => {
      console.log("getNodesDataWithCustomMiddleware", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFilter", (node) => {
      console.log("getNodesDataWithCustomFilter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomValidator", (node) => {
      console.log("getNodesDataWithCustomValidator", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSerializer", (node) => {
      console.log("getNodesDataWithCustomSerializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDeserializer", (node) => {
      console.log("getNodesDataWithCustomDeserializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomConverter", (node) => {
      console.log("getNodesDataWithCustomConverter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFormatter", (node) => {
      console.log("getNodesDataWithCustomFormatter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomParser", (node) => {
      console.log("getNodesDataWithCustomParser", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomRenderer", (node) => {
      console.log("getNodesDataWithCustomRenderer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomComponent", (node) => {
      console.log("getNodesDataWithCustomComponent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDirective", (node) => {
      console.log("getNodesDataWithCustomDirective", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomPipe", (node) => {
      console.log("getNodesDataWithCustomPipe", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomGuard", (node) => {
      console.log("getNodesDataWithCustomGuard", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomResolver", (node) => {
      console.log("getNodesDataWithCustomResolver", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSubscriber", (node) => {
      console.log("getNodesDataWithCustomSubscriber", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomInterceptor", (node) => {
      console.log("getNodesDataWithCustomInterceptor", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomMiddleware", (node) => {
      console.log("getNodesDataWithCustomMiddleware", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFilter", (node) => {
      console.log("getNodesDataWithCustomFilter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomValidator", (node) => {
      console.log("getNodesDataWithCustomValidator", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSerializer", (node) => {
      console.log("getNodesDataWithCustomSerializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDeserializer", (node) => {
      console.log("getNodesDataWithCustomDeserializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomConverter", (node) => {
      console.log("getNodesDataWithCustomConverter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFormatter", (node) => {
      console.log("getNodesDataWithCustomFormatter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomParser", (node) => {
      console.log("getNodesDataWithCustomParser", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomRenderer", (node) => {
      console.log("getNodesDataWithCustomRenderer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomComponent", (node) => {
      console.log("getNodesDataWithCustomComponent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDirective", (node) => {
      console.log("getNodesDataWithCustomDirective", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomPipe", (node) => {
      console.log("getNodesDataWithCustomPipe", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomGuard", (node) => {
      console.log("getNodesDataWithCustomGuard", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomResolver", (node) => {
      console.log("getNodesDataWithCustomResolver", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSubscriber", (node) => {
      console.log("getNodesDataWithCustomSubscriber", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomInterceptor", (node) => {
      console.log("getNodesDataWithCustomInterceptor", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomMiddleware", (node) => {
      console.log("getNodesDataWithCustomMiddleware", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFilter", (node) => {
      console.log("getNodesDataWithCustomFilter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomValidator", (node) => {
      console.log("getNodesDataWithCustomValidator", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomSerializer", (node) => {
      console.log("getNodesDataWithCustomSerializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDeserializer", (node) => {
      console.log("getNodesDataWithCustomDeserializer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomConverter", (node) => {
      console.log("getNodesDataWithCustomConverter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomFormatter", (node) => {
      console.log("getNodesDataWithCustomFormatter", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomParser", (node) => {
      console.log("getNodesDataWithCustomParser", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomRenderer", (node) => {
      console.log("getNodesDataWithCustomRenderer", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomComponent", (node) => {
      console.log("getNodesDataWithCustomComponent", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomDirective", (node) => {
      console.log("getNodesDataWithCustomDirective", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomPipe", (node) => {
      console.log("getNodesDataWithCustomPipe", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesDataWithCustomGuard", (node) => {
      console.log("getNodesDataWithCustomGuard", node);
      setSelectedNode(node.id);
    });

    mindElixir.current. bus.addListener("getNodesData
