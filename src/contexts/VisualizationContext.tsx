
import React, { createContext, useContext, ReactNode } from "react";
import { useVisualization, VisualizationType } from "@/hooks/use-visualization";
import VisualizationModal from "@/components/visualization/VisualizationModal";

interface VisualizationContextType {
  openVisualization: (type: VisualizationType) => void;
}

// Create the context with a default value
const VisualizationContext = createContext<VisualizationContextType>({
  openVisualization: () => console.warn("VisualizationProvider not mounted yet")
});

export const useVisualizationContext = () => {
  return useContext(VisualizationContext);
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
