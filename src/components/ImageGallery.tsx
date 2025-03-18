
import React from 'react';
import { ExtractedImage } from '@/hooks/usePdfImageExtractor';

interface ImageGalleryProps {
  images: ExtractedImage[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Extracted Images ({images.length})</h3>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => (
          <div key={image.id} className="border rounded overflow-hidden">
            <img 
              src={image.base64Data} 
              alt={`Image from page ${image.pageNumber}`} 
              className="w-full h-auto"
            />
            <div className="text-xs p-1 bg-gray-50 text-gray-600">
              Page {image.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
