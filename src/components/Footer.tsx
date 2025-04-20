
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-semibold">mapmypaper</span>
          </div>
          <nav className="flex gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/mindmap" className="text-gray-600 hover:text-gray-900">Mind Maps</Link>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
            <Link to="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
          </nav>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} mapmypaper. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
