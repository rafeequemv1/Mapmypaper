
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
    // Default to flowchart type for all visualizations
    setVisualizationType("flowchart");
    setImageData(images);
    
    // Use a small delay to ensure state is set before opening modal
    setTimeout(() => {
      setIsOpen(true);
    }, 10);
  };

  const closeModal = () => {
    // Close the modal first, then clean up data
    setIsOpen(false);
    
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
