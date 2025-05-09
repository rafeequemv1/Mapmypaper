
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";

const ADMIN_EMAIL = "rafeequemavoor@gmal.com"; // Specific admin email

const Admin = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is not the admin
    if (!isLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render if it's the admin
  if (user?.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="flex h-full min-h-screen pt-16">
      <AdminSidebar />
      <div className="flex-1 p-8 bg-gray-50">
        <AdminOverview />
      </div>
    </div>
  );
};

export default Admin;
