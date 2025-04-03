
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm py-3 px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-lg font-bold">
            <span className="bg-black text-white p-1.5 rounded-md inline-flex items-center justify-center mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19-1.14-.93-2-2.31-2.29-3.76a6.43 6.43 0 0 0 0-1.6"></path>
                <path d="M17 16.3c-2.2 0-4-1.83-4-4.05 0-1.16.57-2.26 1.71-3.19 1.14-.93 2-2.31 2.29-3.76.19-.55.29-1.03.29-1.6"></path>
                <path d="M12 12v6"></path>
                <path d="M12 18v4"></path>
              </svg>
            </span>
            mapmypaper
          </Link>
          <div className="bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
            BETA
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/mindmap">
                <Button variant="outline" size="sm">
                  My Mind Maps
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                    <User size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-gray-500">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
