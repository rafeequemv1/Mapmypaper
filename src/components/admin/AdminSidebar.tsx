
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings 
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { 
      name: "Overview", 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      path: "/admin" 
    },
    { 
      name: "Users", 
      icon: <Users className="h-5 w-5" />, 
      path: "/admin/users" 
    },
    { 
      name: "Documents", 
      icon: <FileText className="h-5 w-5" />, 
      path: "/admin/documents" 
    },
    { 
      name: "Settings", 
      icon: <Settings className="h-5 w-5" />, 
      path: "/admin/settings" 
    }
  ];

  return (
    <div className="w-64 bg-white border-r h-full min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your application</p>
      </div>
      
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link 
                to={item.path}
                className={`flex items-center px-6 py-3 hover:bg-gray-50 ${
                  location.pathname === item.path ? "bg-gray-100 border-l-4 border-blue-500" : ""
                }`}
              >
                <span className="mr-3 text-gray-600">{item.icon}</span>
                <span className={`${
                  location.pathname === item.path ? "font-medium text-blue-600" : "text-gray-700"
                }`}>
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
