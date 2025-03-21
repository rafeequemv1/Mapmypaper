
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // With auth removed, we simply render the children without any protection
  return <>{children}</>;
};

export default ProtectedRoute;
