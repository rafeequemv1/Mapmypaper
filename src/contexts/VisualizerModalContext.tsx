
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
    // Set data first, then open modal
    setVisualizationType("flowchart");
    setImageData(images);
    
    // Use requestAnimationFrame to ensure state is set before opening modal
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  };

  const closeModal = () => {
    // Close the modal first, then clean up data
    setIsOpen(false);
    
    // Use requestAnimationFrame to ensure modal is closed before cleaning up data
    requestAnimationFrame(() => {
      setVisualizationType("");
      setImageData(undefined);
    });
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
