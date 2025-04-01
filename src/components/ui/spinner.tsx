
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin text-gray-400", className)}
      {...props}
    >
      <Loader2 
        className={cn(
          "size-4",
          size === "sm" && "size-3",
          size === "md" && "size-4",
          size === "lg" && "size-6"
        )} 
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
