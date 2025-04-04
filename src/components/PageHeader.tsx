
import React from 'react';
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import PaperLogo from "@/components/PaperLogo";
import UserMenu from "@/components/UserMenu";

type PageHeaderProps = {
  showBackButton?: boolean;
  showUserMenu?: boolean;
  additionalLinks?: {
    to: string;
    label: string;
  }[];
};

const PageHeader = ({ 
  showBackButton = true, 
  showUserMenu = true,
  additionalLinks = []
}: PageHeaderProps) => {
  return (
    <header className="w-full bg-card shadow-sm py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <PaperLogo size="md" />
            <h1 className="text-xl font-medium text-foreground">mapmypaper</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {additionalLinks.map(link => (
            <Link 
              key={link.to}
              to={link.to} 
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          {showBackButton && (
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
          )}
          
          {showUserMenu && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
