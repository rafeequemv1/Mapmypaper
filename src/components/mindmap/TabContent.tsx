
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, FileChartLine, MessageSquare, BookOpenText } from "lucide-react";
import { MindElixirInstance } from "mind-elixir";
import { cn } from "@/lib/utils";

interface TabContentProps {
  mindMapView: React.ReactNode;
  chatView: React.ReactNode;
  onShowSummary: () => void;
  onShowFlowchart: () => void;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  explainText: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TabContent = ({
  mindMapView,
  chatView,
  onShowSummary,
  onShowFlowchart,
  explainText,
  activeTab = "mindmap",
  onTabChange,
}: TabContentProps) => {
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="mb-2 self-start">
          <TabsTrigger value="mindmap" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Mind Map</span>
          </TabsTrigger>
          <TabsTrigger value="flowchart" className="flex items-center gap-2" onClick={(e) => {
            e.preventDefault();
            onShowFlowchart();
          }}>
            <FileChartLine className="h-4 w-4" />
            <span>Flowchart</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2" onClick={(e) => {
            e.preventDefault();
            onShowSummary();
          }}>
            <BookOpenText className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="mindmap" className="h-full m-0 overflow-auto">
            {mindMapView}
          </TabsContent>
          <TabsContent value="chat" className="h-full m-0 overflow-auto">
            {chatView}
          </TabsContent>
          {/* Flowchart and Summary are handled via modals, so their TabsContent elements are just placeholders */}
          <TabsContent value="flowchart" className="h-full m-0">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Opening flowchart view...</p>
            </div>
          </TabsContent>
          <TabsContent value="summary" className="h-full m-0">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Opening summary view...</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TabContent;
