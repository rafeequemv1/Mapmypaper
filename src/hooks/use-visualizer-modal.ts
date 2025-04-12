
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, imageData, openModal, closeModal } = useVisualizerModalContext();

  // Since we're focusing only on flowchart visualization, we don't need to accept a type parameter
  const handleOpenVisualizerModal = (images?: string[]) => {
    console.log("Opening flowchart visualizer modal", images ? `with ${images.length} images` : "without images");
    openModal("flowchart", images);
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
