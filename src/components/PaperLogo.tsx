
import React from "react";

interface PaperLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PaperLogo = ({ className = "", size = "md" }: PaperLogoProps) => {
  // Determine the size of the logo
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }[size];

  return (
    <div className={`relative ${sizeClasses} ${className}`}>
      {/* Base paper */}
      <div className="absolute inset-0 bg-white border-2 border-[#333] rounded-tr-md rounded-br-md rounded-bl-md transform rotate-1"></div>
      
      {/* Paper fold */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-gray-100 border-l-2 border-b-2 border-[#333] transform rotate-45 -translate-x-0.5 -translate-y-0.5"></div>
      
      {/* Paper line 1 */}
      <div className="absolute top-1/3 left-1 right-1 h-0.5 bg-gray-300"></div>
      
      {/* Paper line 2 */}
      <div className="absolute top-2/3 left-1 right-1 h-0.5 bg-gray-300"></div>
    </div>
  );
};

export default PaperLogo;
