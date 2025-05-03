
import React from "react";
import UserMenu from "@/components/UserMenu";

const HeaderSidebar: React.FC = () => {
  return (
    <div className="ml-4 flex items-center">
      <UserMenu />
    </div>
  );
};

export default HeaderSidebar;
