
import React from "react";
import { Button } from "@/components/ui/button";

interface HeaderSidebarIconProps {
  active?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  title?: string;
  className?: string;
}

const HeaderSidebarIcon: React.FC<HeaderSidebarIconProps> = ({
  active = false,
  onClick,
  icon,
  title,
  className = "",
}) => (
  <Button
    variant={active ? "default" : "ghost"}
    onClick={onClick}
    className={`w-9 h-9 p-0 ${active ? "text-blue-600 bg-blue-50" : "text-black"} ${className}`}
    title={title}
  >
    {icon}
  </Button>
);

export default HeaderSidebarIcon;
