
import React from "react";
import { Camera } from "lucide-react";
import HeaderSidebarIcon from "./HeaderSidebarIcon";

interface SnapshotButtonProps {
  onClick: () => void;
  active?: boolean;
}

const SnapshotButton: React.FC<SnapshotButtonProps> = ({ onClick, active = false }) => {
  return (
    <HeaderSidebarIcon
      onClick={onClick}
      icon={<Camera className="h-4 w-4" />}
      title="Take Snapshot"
      active={active}
    />
  );
};

export default SnapshotButton;
