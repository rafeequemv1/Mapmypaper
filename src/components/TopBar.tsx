
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import UserMenu from "./UserMenu";

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-semibold">mapmypaper</div>
        {user ? (
          <UserMenu />
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth?tab=signup')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
