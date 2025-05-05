import * as React from "react"

import { cn } from "@/lib/utils"

const TooltipProvider = React.forwardRef<
  React.ElementRef<typeof React.Provider>,
  React.ComponentPropsWithoutRef<typeof React.Provider>
>(({ children, ...props }, ref) => (
  <React.Provider ref={ref} {...props}>
    {children}
  </React.Provider>
))
TooltipProvider.displayName = "TooltipProvider"

const Tooltip = React.forwardRef<
  React.ElementRef<typeof React.forwardRef>,
  React.ComponentPropsWithoutRef<typeof React.forwardRef>
>(({ className, children, ...props }, ref) => (
  <div className={cn("relative", className)} {...props} ref={ref}>
    {children}
  </div>
))
Tooltip.displayName = "Tooltip"

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof React.forwardRef>,
  React.ComponentPropsWithoutRef<typeof React.forwardRef>
>(({ className, children, ...props }, ref) => (
  <div className={cn("contents", className)} {...props} ref={ref}>
    {children}
  </div>
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof React.forwardRef>,
  React.ComponentPropsWithoutRef<typeof React.forwardRef>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <div
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground p-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    )}
    ref={ref}
    sideOffset={sideOffset}
    {...props}
  />
))
TooltipContent.displayName = "TooltipContent"

// Add the PositionedTooltip component
import React, { forwardRef } from "react";

interface PositionedTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
}

const PositionedTooltip = forwardRef<HTMLDivElement, PositionedTooltipProps>(
  ({ show, x, y, children, className = "", ...props }, ref) => {
    if (!show) return null;
    
    return (
      <div
        ref={ref}
        className={`absolute z-50 flex bg-white rounded-md shadow-md p-0.5 ${className}`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PositionedTooltip.displayName = "PositionedTooltip";

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, PositionedTooltip }
