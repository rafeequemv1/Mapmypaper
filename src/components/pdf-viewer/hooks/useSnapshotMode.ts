
import { useState, useRef, useEffect } from 'react';
import { createSelectionRect, toggleTextSelection } from "@/utils/captureUtils";
import { useToast } from "@/hooks/use-toast";

export function useSnapshotMode(
  pdfContainerRef: React.RefObject<HTMLDivElement>,
  viewportRef: React.RefObject<HTMLDivElement | null>,
  isSnapshotMode: boolean = false, 
  setIsSnapshotMode?: (isActive: boolean) => void,
  onImageCaptured?: (imageData: string) => void
) {
  const [localIsSnapshotMode, setLocalIsSnapshotMode] = useState(isSnapshotMode);
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const selectionRectRef = useRef<ReturnType<typeof createSelectionRect> | null>(null);
  const { toast } = useToast();
  
  // Sync local state with prop
  useEffect(() => {
    setLocalIsSnapshotMode(isSnapshotMode);
  }, [isSnapshotMode]);

  // Updated effect for snapshot mode with capture tooltip - modified to prevent duplicate events
  useEffect(() => {
    if (!pdfContainerRef.current || !viewportRef.current) return;
    
    // Clean up any existing selection rect
    if (selectionRectRef.current) {
      selectionRectRef.current.destroy();
      selectionRectRef.current = null;
    }
    
    if (localIsSnapshotMode) {
      // Disable text selection when entering snapshot mode
      toggleTextSelection(false);
      
      // Create new selection rect handler when entering snapshot mode
      selectionRectRef.current = createSelectionRect(pdfContainerRef.current);
      
      // Add mouse event handlers for snapshot mode
      const viewport = viewportRef.current;
      
      const handleMouseDown = (e: MouseEvent) => {
        if (!localIsSnapshotMode || !selectionRectRef.current) return;
        selectionRectRef.current.startSelection(e.clientX, e.clientY);
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!localIsSnapshotMode || !selectionRectRef.current) return;
        selectionRectRef.current.moveSelection(e.clientX, e.clientY);
      };
      
      const handleMouseUp = (e: MouseEvent) => {
        if (!localIsSnapshotMode || !selectionRectRef.current) return;
        selectionRectRef.current.endSelection(e.clientX, e.clientY);
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && localIsSnapshotMode) {
          // Cancel selection on Escape key
          if (selectionRectRef.current) {
            selectionRectRef.current.cancelSelection();
          }
          setLocalIsSnapshotMode(false);
          if (setIsSnapshotMode) {
            setIsSnapshotMode(false);
          }
          // Re-enable text selection when exiting snapshot mode
          toggleTextSelection(true);
        }
      };
      
      // Add new handler for the captureArea custom event with safeguards against duplicate events
      const handleCaptureArea = async (e: Event) => {
        const customEvent = e as CustomEvent;
        if (!customEvent.detail?.rect || !pdfContainerRef.current || isProcessingCapture) return;
        
        // Set processing flag to true to prevent duplicate captures
        setIsProcessingCapture(true);
        
        const rect = customEvent.detail.rect;
        
        try {
          // Import dynamically to reduce initial load
          const { captureElementArea } = await import('@/utils/captureUtils');
          
          // Capture the selected area
          const imageData = await captureElementArea(pdfContainerRef.current, rect);
          
          if (imageData && onImageCaptured) {
            // Send captured image to chat
            onImageCaptured(imageData);
            
            toast({
              title: "Area captured",
              description: "The selected area has been sent to chat",
            });
          }
        } catch (error) {
          console.error("Error capturing area:", error);
          toast({
            title: "Capture failed",
            description: "Failed to capture the selected area",
            variant: "destructive"
          });
          
          // Reset the capturing state and clean up
          if (selectionRectRef.current) {
            selectionRectRef.current.setCapturing(false);
            selectionRectRef.current.cancelSelection();
          }
          setLocalIsSnapshotMode(false);
          if (setIsSnapshotMode) {
            setIsSnapshotMode(false);
          }
          // Re-enable text selection when capture fails
          toggleTextSelection(true);
          
          // Reset processing flag after a short delay
          setTimeout(() => {
            setIsProcessingCapture(false);
          }, 500);
        }
      };
      
      // Add event listeners
      viewport.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("keydown", handleKeyDown);
      pdfContainerRef.current.addEventListener("captureArea", handleCaptureArea);
      
      // Set cursor to crosshair when in snapshot mode
      viewport.style.cursor = "crosshair";
      
      return () => {
        // Remove event listeners when cleaning up
        viewport.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("keydown", handleKeyDown);
        if (pdfContainerRef.current) {
          pdfContainerRef.current.removeEventListener("captureArea", handleCaptureArea);
        }
        
        // Reset cursor
        viewport.style.cursor = "";
        
        // Re-enable text selection when unmounting
        toggleTextSelection(true);
      };
    } else {
      // Re-enable text selection when exiting snapshot mode
      toggleTextSelection(true);
    }
  }, [localIsSnapshotMode, toast, onImageCaptured, isProcessingCapture, setIsSnapshotMode]);

  // Listen for capture complete events to update UI
  useEffect(() => {
    const handleCaptureDone = (e: CustomEvent) => {
      if (selectionRectRef.current && e.detail?.success) {
        // Update the selection rectangle UI to show completion
        selectionRectRef.current.captureComplete();
        
        // After a short delay, reset snapshot mode
        setTimeout(() => {
          if (selectionRectRef.current) {
            // Don't cancel selection yet - let the success UI remain visible
            // Instead we'll just exit snapshot mode
            setLocalIsSnapshotMode(false);
            if (setIsSnapshotMode) {
              setIsSnapshotMode(false);
            }
            setIsProcessingCapture(false);
          }
        }, 1000);
      }
    };
    
    window.addEventListener('captureDone', handleCaptureDone as EventListener);
    
    return () => {
      window.removeEventListener('captureDone', handleCaptureDone as EventListener);
    };
  }, [setIsSnapshotMode]);
  
  const toggleSnapshotMode = () => {
    if (localIsSnapshotMode) {
      // Cancel snapshot mode if active
      setLocalIsSnapshotMode(false);
      if (setIsSnapshotMode) {
        setIsSnapshotMode(false);
      }
      // Re-enable text selection when exiting snapshot mode
      toggleTextSelection(true);
      if (selectionRectRef.current) {
        selectionRectRef.current.cancelSelection();
      }
    } else {
      // Enable snapshot mode
      setLocalIsSnapshotMode(true);
      if (setIsSnapshotMode) {
        setIsSnapshotMode(true);
      }
    }
  };
  
  const handleCancelSnapshot = () => {
    setLocalIsSnapshotMode(false);
    if (setIsSnapshotMode) {
      setIsSnapshotMode(false);
    }
    // Re-enable text selection when exiting snapshot mode
    toggleTextSelection(true);
    if (selectionRectRef.current) {
      selectionRectRef.current.cancelSelection();
    }
  };
  
  return {
    localIsSnapshotMode,
    isProcessingCapture,
    captureError,
    toggleSnapshotMode,
    handleCancelSnapshot
  };
}

export default useSnapshotMode;
