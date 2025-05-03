
import React from 'react';
import MindMapViewer from '@/components/MindMapViewer';

interface MindMapComponentProps {
  onMindMapReady?: (instance: any) => void;
  isMapGenerated: boolean;
  pdfKey?: string | null;
}

// This is a wrapper component to maintain backward compatibility with the code that
// expects to import MindMapComponent while we actually use MindMapViewer
const MindMapComponent: React.FC<MindMapComponentProps> = ({ 
  onMindMapReady, 
  isMapGenerated,
  pdfKey
}) => {
  return (
    <MindMapViewer
      onMindMapReady={onMindMapReady}
      isMapGenerated={isMapGenerated}
      pdfKey={pdfKey}
    />
  );
};

export default MindMapComponent;
