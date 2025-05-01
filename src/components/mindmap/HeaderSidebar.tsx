
import React from "react";
import {
  FileCode,
  MessageSquare,
  FileText,
  FlowChart,
} from "lucide-react";
import HeaderSidebarIcon from "./HeaderSidebarIcon";
import HeaderExportMenu from "./HeaderExportMenu";
import UserMenu from "@/components/UserMenu";

interface HeaderSidebarProps {
  isPdfActive: boolean;
  isChatActive: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMermaid: React.Dispatch<React.SetStateAction<boolean>>;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
}

const HeaderSidebar: React.FC<HeaderSidebarProps> = ({
  isPdfActive,
  isChatActive,
  togglePdf,
  toggleChat,
  setShowSummary,
  setShowMermaid,
  onExportSVG,
  onExportPNG,
  onExportJSON,
}) => (
  <div className="fixed left-0 top-0 bottom-0 w-12 bg-white border-r flex flex-col items-center py-20 gap-2 z-10">
    <HeaderSidebarIcon
      active={isPdfActive}
      onClick={togglePdf}
      icon={<FileCode className="h-4 w-4" />}
      title="Toggle PDF"
    />
    <HeaderSidebarIcon
      active={isChatActive}
      onClick={toggleChat}
      icon={<MessageSquare className="h-4 w-4" />}
      title="Toggle Chat"
    />
    <HeaderSidebarIcon
      onClick={() => setShowSummary(true)}
      icon={<FileText className="h-4 w-4" />}
      title="Show Summary"
    />
    <HeaderSidebarIcon
      onClick={() => setShowMermaid(true)}
      icon={<FlowChart className="h-4 w-4" />}
      title="Show Document Flowchart"
    />
    <HeaderExportMenu
      onExportSVG={onExportSVG}
      onExportPNG={onExportPNG}
      onExportJSON={onExportJSON}
    />
    
    {/* User Menu at the bottom */}
    <div className="mt-auto mb-4">
      <UserMenu />
    </div>
  </div>
);

export default HeaderSidebar;
