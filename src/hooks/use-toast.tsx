
import React, { createContext, useContext, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  dismissible?: boolean;
  duration?: number;
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
  const sonnerToast = (title: any, options: any) => {
    // This is just a placeholder since we're not using the actual Sonner toast
    console.log("Toast:", title, options);
  };

  return sonnerToast(title, {
    description,
    position,
    dismissible: true,
    duration: 5000,
    className: toastVariantClassnames[variant],
    ...props,
  });
}

export type ToastContextType = {
  toast: typeof toast;
  dismiss: (id: string) => void;
  toasts: ToastProps[];
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  const dismiss = (id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <Sonner />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}
