
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
    setVisualizationType(type);
    setImageData(images);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Clear image data when closing the modal
    setImageData(undefined);
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
