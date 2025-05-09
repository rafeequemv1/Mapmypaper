
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera } from "lucide-react";

interface ImageGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sampleImages = [
  { id: 1, url: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7", alt: "Woman with laptop" },
  { id: 2, url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b", alt: "Laptop computer" },
  { id: 3, url: "https://images.unsplash.com/photo-1518770660439-4636190af475", alt: "Circuit board" },
  { id: 4, url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6", alt: "Programming monitor" },
  { id: 5, url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d", alt: "Person using MacBook" },
  { id: 6, url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", alt: "Woman using laptop" },
  { id: 7, url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e", alt: "White robot" },
  { id: 8, url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5", alt: "Matrix movie" },
  { id: 9, url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1", alt: "Laptop computer" },
  { id: 10, url: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7", alt: "Colorful code" },
  { id: 11, url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81", alt: "Video screens display" },
  { id: 12, url: "https://images.unsplash.com/photo-1473091534298-04dcbce3278c", alt: "Stylus pen" },
];

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" /> 
            Image Gallery
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {sampleImages.map(image => (
              <div key={image.id} className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img 
                  src={image.url} 
                  alt={image.alt} 
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="p-2 text-sm text-center text-gray-600">{image.alt}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGalleryModal;
