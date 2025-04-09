
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, imageData, openModal, closeModal } = useVisualizerModalContext();

  // Ensure the modal is properly opened with the specified type
  const handleOpenVisualizerModal = (type: string, images?: string[]) => {
    // Log for debugging
    console.log("Opening visualizer modal with type:", type);
    if (images) {
      console.log("Image data provided:", images.length, "images");
    }
    
    // Make sure we start fresh - first close any existing modal before opening
    if (isOpen) {
      closeModal();
      // Use a small timeout to ensure the previous modal is fully closed
      setTimeout(() => {
        openModal(type, images);
      }, 10);
    } else {
      openModal(type, images);
    }
  };

  // Ensure proper cleanup when closing the modal
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
