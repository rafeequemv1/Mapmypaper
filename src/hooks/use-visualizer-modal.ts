
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, openModal, closeModal } = useVisualizerModalContext();

  // Ensure the modal is properly opened with the specified type
  const handleOpenVisualizerModal = (type: string) => {
    // Log for debugging
    console.log("Opening visualizer modal with type:", type);
    openModal(type);
  };

  return {
    isVisualizerModalOpen: isOpen,
    visualizationType,
    openVisualizerModal: handleOpenVisualizerModal,
    closeVisualizerModal: closeModal
  };
};
