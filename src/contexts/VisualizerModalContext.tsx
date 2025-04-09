
import React, { createContext, useContext, useState } from "react";

interface VisualizerModalContextType {
  isOpen: boolean;
  visualizationType: string;
  imageData?: string[];
  openModal: (type: string, imageData?: string[]) => void;
  closeModal: () => void;
}

const VisualizerModalContext = createContext<VisualizerModalContextType | undefined>(undefined);

export function VisualizerModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [visualizationType, setVisualizationType] = useState("");
  const [imageData, setImageData] = useState<string[] | undefined>(undefined);

  const openModal = (type: string, images?: string[]) => {
    // Only set open state after setting other properties
    setVisualizationType(type);
    setImageData(images);
    setTimeout(() => {
      setIsOpen(true);
    }, 0);
  };

  const closeModal = () => {
    // Close the modal first, then clean up data after a short delay
    setIsOpen(false);
    
    // Use a small delay to ensure modal is fully closed before resetting state
    setTimeout(() => {
      setVisualizationType("");
      setImageData(undefined);
    }, 300);
  };

  return (
    <VisualizerModalContext.Provider
      value={{
        isOpen,
        visualizationType,
        imageData,
        openModal,
        closeModal
      }}
    >
      {children}
    </VisualizerModalContext.Provider>
  );
}

export const useVisualizerModalContext = () => {
  const context = useContext(VisualizerModalContext);
  if (context === undefined) {
    throw new Error("useVisualizerModalContext must be used within a VisualizerModalProvider");
  }
  return context;
};
