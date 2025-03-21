
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // In demo mode, we allow access to all routes
  return <>{children}</>;
};

export default ProtectedRoute;
