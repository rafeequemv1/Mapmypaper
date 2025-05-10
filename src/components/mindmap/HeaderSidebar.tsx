
import React from "react";
import {
  FileCode,
  MessageSquare,
  FileText,
  Home,
  Network,
  Camera
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderSidebarIcon from "./HeaderSidebarIcon";
import HeaderExportMenu from "./HeaderExportMenu";
import UserMenu from "@/components/UserMenu";
import SnapshotButton from "./SnapshotButton";

interface HeaderSidebarProps {
  isPdfActive: boolean;
  isChatActive: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart: React.Dispatch<React.SetStateAction<boolean>>;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
  toggleSnapshotMode?: () => void;
  isSnapshotModeActive?: boolean;
}

const HeaderSidebar: React.FC<HeaderSidebarProps> = ({
  isPdfActive,
  isChatActive,
  togglePdf,
  toggleChat,
  setShowSummary,
  setShowFlowchart,
  onExportSVG,
  onExportPNG,
  onExportJSON,
  onExportPDF,
  toggleSnapshotMode,
  isSnapshotModeActive = false
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed left-0 top-0 bottom-0 w-12 bg-white border-r flex flex-col items-center py-4 gap-2 z-10">
      {/* Home button at the very top */}
      <HeaderSidebarIcon
        onClick={() => navigate('/')}
        icon={<Home className="h-4 w-4" />}
        title="Go to Home"
        className="mb-4"
      />
      
      {/* Divider line */}
      <div className="w-8 h-px bg-gray-200 mb-4"></div>
      
      {/* Original buttons */}
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
      {/* Snapshot button - only show when toggleSnapshotMode is provided */}
      {toggleSnapshotMode && (
        <SnapshotButton 
          onClick={toggleSnapshotMode} 
          active={isSnapshotModeActive}
        />
      )}
      <HeaderSidebarIcon
        onClick={() => setShowSummary(true)}
        icon={<FileText className="h-4 w-4" />}
        title="Show Summary"
      />
      <HeaderSidebarIcon
        onClick={() => setShowFlowchart(true)}
        icon={<Network className="h-4 w-4" />}
        title="Show Flowchart"
      />
      <HeaderExportMenu
        onExportSVG={onExportSVG}
        onExportPNG={onExportPNG}
        onExportJSON={onExportJSON}
        onExportPDF={onExportPDF}
      />
      {/* User Menu at the bottom */}
      <div className="mt-auto mb-4">
        <UserMenu />
      </div>
    </div>
  );
};

export default HeaderSidebar;
