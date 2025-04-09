
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
    // First set the data
    setVisualizationType(type);
    setImageData(images);
    
    // Then open the modal with a slight delay to ensure React has updated the state
    setTimeout(() => {
      setIsOpen(true);
    }, 10);
  };

  const closeModal = () => {
    // Close the modal first
    setIsOpen(false);
    
    // Clean up data after a delay to ensure animations complete
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
