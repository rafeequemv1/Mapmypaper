
import MindMapContainer from "./mindmap/MindMapContainer";
import { ExtractedImage } from "@/hooks/usePdfProcessor";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  extractedImages?: ExtractedImage[];
}

const MindMapViewer = ({ isMapGenerated, extractedImages }: MindMapViewerProps) => {
  return (
    <MindMapContainer 
      isMapGenerated={isMapGenerated} 
      extractedImages={extractedImages} 
    />
  );
};

export default MindMapViewer;
