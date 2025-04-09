
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, imageData, openModal, closeModal } = useVisualizerModalContext();

  // Focus only on flowchart visualization
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
