
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // With auth completely removed, we simply render the children
  return <>{children}</>;
};

export default ProtectedRoute;
