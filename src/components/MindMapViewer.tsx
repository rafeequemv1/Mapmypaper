
import MindMapContainer from "./mindmap/MindMapContainer";

interface MindMapViewerProps {
  isMapGenerated: boolean;
}

const MindMapViewer = ({ isMapGenerated }: MindMapViewerProps) => {
  return <MindMapContainer isMapGenerated={isMapGenerated} />;
};

export default MindMapViewer;
