
import { Link } from "react-router-dom";
import { Mail, FileText, DollarSign } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8 invert" />
              <span className="text-xl font-semibold">mapmypaper</span>
            </div>
            <p className="text-sm text-gray-300">
              Transform academic papers into visual knowledge maps
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Resources</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/pricing" className="text-gray-300 hover:text-white inline-flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </Link>
              <Link to="/contact" className="text-gray-300 hover:text-white inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Link>
            </nav>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/policy" className="text-gray-300 hover:text-white inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link to="/refund" className="text-gray-300 hover:text-white inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Refund Policy
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-800 text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} mapmypaper. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
