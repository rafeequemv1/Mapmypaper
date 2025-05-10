
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Improve the display of rate limit error messages
        if (typeof description === 'string' && description.includes('rate limit')) {
          variant = 'warning';
          description = (
            <>
              {description}
              <div className="mt-2 text-xs text-amber-700">
                This is typically due to free tier limitations. The app will automatically retry.
              </div>
            </>
          );
        }
        
        return (
          <Toast 
            key={id} 
            // Convert our success/warning variants to default for compatibility
            variant={variant === "success" || variant === "warning" ? "default" : variant}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-0 left-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:left-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
