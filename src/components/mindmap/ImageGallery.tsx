
import { useState } from 'react';
import { ExtractedImage } from '@/hooks/usePdfProcessor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Maximize2, Minimize2, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: ExtractedImage[];
  onAddImageNode: (imageData: string) => void;
}

const ImageGallery = ({ images, onAddImageNode }: ImageGalleryProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ExtractedImage | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`bg-background border-l transition-all duration-200 ${isOpen ? 'w-64' : 'w-10'}`}>
      {isOpen ? (
        <>
          <div className="p-2 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              <h3 className="text-sm font-medium">PDF Images</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsOpen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-2 grid gap-2">
              {images.map((image) => (
                <div 
                  key={image.id} 
                  className="border rounded-md p-1 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedImage(image)}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <img 
                          src={image.data} 
                          alt={`Image from page ${image.pageNumber}`} 
                          className="w-full h-auto object-contain rounded"
                        />
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          Page {image.pageNumber}
                        </p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <div className="flex flex-col items-center">
                        <img 
                          src={image.data} 
                          alt={`Image from page ${image.pageNumber}`} 
                          className="max-h-[70vh] w-auto object-contain"
                        />
                        <div className="flex gap-2 mt-4">
                          <Button onClick={() => onAddImageNode(image.data)}>
                            Add to Mind Map
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div 
          className="h-full flex flex-col items-center py-2 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
          <div className="writing-vertical-lr mt-2 text-xs text-muted-foreground transform rotate-180">
            PDF Images
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
