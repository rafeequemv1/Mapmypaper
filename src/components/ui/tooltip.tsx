
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground p-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = "TooltipContent"

// Add the PositionedTooltip component
interface PositionedTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
}

const PositionedTooltip = React.forwardRef<HTMLDivElement, PositionedTooltipProps>(
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

export {
  TooltipProvider,
  TooltipRoot as Tooltip,
  TooltipTrigger,
  TooltipContent,
  PositionedTooltip
}
