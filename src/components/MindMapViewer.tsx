
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

// Create the missing CSS file
<lov-write file_path="src/styles/node-menu.css">
/* Node menu styles */
.mind-elixir-node-menu {
  position: absolute;
  z-index: 10;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 5px 0;
  min-width: 200px;
}

.mind-elixir-node-menu div {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.mind-elixir-node-menu div:hover {
  background-color: #f5f5f5;
}

.mind-elixir-style-panel {
  position: absolute;
  z-index: 10;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 10px;
  min-width: 200px;
}

/* Add custom styling for the mind map */
.mind-elixir-root {
  padding: 12px 16px !important;
  border-radius: 8px !important;
  font-weight: bold !important;
}

.mind-elixir-topic {
  padding: 8px 12px !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  max-width: 300px !important;
}

.mind-elixir-topic:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-2px) !important;
}

/* Hide the control panel buttons */
.mind-elixir-toolbar {
  display: none !important;
}
