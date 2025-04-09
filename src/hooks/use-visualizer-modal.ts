
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, imageData, openModal, closeModal } = useVisualizerModalContext();

  // Since we're focusing only on flowchart visualization, we don't need to accept a type parameter
  const handleOpenVisualizerModal = () => {
    console.log("Opening flowchart visualizer modal");
    openModal("flowchart");
  };

  const handleCloseVisualizerModal = () => {
    console.log("Closing visualizer modal");
    closeModal();
  };

  return {
    isVisualizerModalOpen: isOpen,
    visualizationType,
    imageData,
    openVisualizerModal: handleOpenVisualizerModal,
    closeVisualizerModal: handleCloseVisualizerModal
  };
};
