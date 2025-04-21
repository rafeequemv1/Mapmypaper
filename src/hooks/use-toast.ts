
import * as React from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  dismissible?: boolean;
  duration?: number;
  // You can add other sonner toast options here if needed
};

const toastVariantClassnames = {
  default: "",
  destructive: "destructive",
  success: "success",
  warning: "warning",
};

export function toast({
  title,
  description,
  variant = "default",
  position = "bottom-left",
  ...props
}: ToastProps) {
  return sonnerToast(title, {
    description,
    position,
    dismissible: true,
    duration: 5000,
    className: toastVariantClassnames[variant],
    ...props,
  });
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts
  };
}
