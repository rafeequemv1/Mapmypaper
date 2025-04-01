
import React from "react";
import { Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t py-3">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
        <div className="mb-2 sm:mb-0">
          <p>&copy; {new Date().getFullYear()} mapmypaper. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/in/rafeequemavoor/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Linkedin size={16} />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://x.com/rafeequemavoor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Twitter size={16} />
            <span>Twitter</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
