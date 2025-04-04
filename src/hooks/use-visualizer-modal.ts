
import { useVisualizerModalContext } from "@/contexts/VisualizerModalContext";

export const useVisualizerModal = () => {
  const { isOpen, visualizationType, openModal, closeModal } = useVisualizerModalContext();

  return {
    isVisualizerModalOpen: isOpen,
    visualizationType,
    openVisualizerModal: openModal,
    closeVisualizerModal: closeModal
  };
};
