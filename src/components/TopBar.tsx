
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Logo className="h-5 w-5" />
            <span className="font-medium">mapmypaper</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/about')}
          >
            About
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/features')}
          >
            Features
          </Button>
          {user ? (
            <UserMenu />
          ) : (
            <Button 
              variant="outline"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
