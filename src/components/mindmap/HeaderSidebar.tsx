
import React from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";
import { Home } from "lucide-react";

const HeaderSidebar: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between w-full pr-3">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-gray-100 rounded-full"
          title="Home"
        >
          <Home className="h-5 w-5 text-primary" />
        </button>
      </div>
      <UserMenu />
    </div>
  );
};

export default HeaderSidebar;
