
import React from "react";

const TypingIndicator = () => {
  return (
    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
