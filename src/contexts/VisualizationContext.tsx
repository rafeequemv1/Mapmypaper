
import React, { createContext, useContext, ReactNode } from "react";
import { useVisualization, VisualizationType } from "@/hooks/use-visualization";
import VisualizationModal from "@/components/visualization/VisualizationModal";

interface VisualizationContextType {
  openVisualization: (type: VisualizationType) => void;
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

export const useVisualizationContext = () => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error("useVisualizationContext must be used within a VisualizationProvider");
  }
  return context;
};

export const VisualizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isModalOpen,
    visualizationType,
    mermaidSyntax,
    isGenerating,
    openModal,
    closeModal,
    updateSyntax,
    generateVisualization
  } = useVisualization();
  
  const handleRegenerate = () => {
    generateVisualization(visualizationType);
  };
  
  return (
    <VisualizationContext.Provider value={{ openVisualization: openModal }}>
      {children}
      
      <VisualizationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        visualizationType={visualizationType}
        mermaidSyntax={mermaidSyntax}
        onSyntaxChange={updateSyntax}
        isGenerating={isGenerating}
        onRegenerate={handleRegenerate}
      />
    </VisualizationContext.Provider>
  );
};
