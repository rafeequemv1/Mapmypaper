
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
    openModal(type, images);
  };

  return {
    isVisualizerModalOpen: isOpen,
    visualizationType,
    imageData,
    openVisualizerModal: handleOpenVisualizerModal,
    closeVisualizerModal: closeModal
  };
};
