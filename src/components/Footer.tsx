
import React from 'react';
import { Link } from "react-router-dom";
import { ExternalLink } from 'lucide-react';
import PaperLogo from "@/components/PaperLogo";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PaperLogo size="sm" />
              <h2 className="text-lg font-medium text-foreground">mapmypaper</h2>
            </div>
            <p className="text-foreground/70 text-sm">
              Transform research papers into interactive mind maps for better comprehension and retention.
            </p>
            <p className="text-foreground/70 text-sm mt-2">
              Developed by <a href="https://scidart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Scidart Academy</a>
            </p>
            <p className="text-foreground/70 text-xs mt-3">
              Your documents are secure. We prioritize your privacy and data protection.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-foreground/70 hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-foreground/70 hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="text-foreground/70 hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/auth" className="text-foreground/70 hover:text-foreground transition-colors">Sign In</Link></li>
              <li>
                <a 
                  href="https://blog.mapmypaper.com" 
                  className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Blog <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-foreground/70 hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-foreground/70 hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-foreground/70 hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="text-center text-sm text-foreground/60">
          <p>© {new Date().getFullYear()} MapMyPaper by Scidart Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
