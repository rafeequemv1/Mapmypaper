
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Download, Loader, Settings } from "lucide-react";
import { ExtractedImage, getExtractedImages, extractImagesFromPdf, storeExtractedImages } from "@/utils/pdfImageExtractor";
import { Button } from "@/components/ui/button";
import { getPdfKey } from "@/components/PdfTabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getPdfData } from "@/utils/pdfStorage";

interface ImageGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ open, onOpenChange }) => {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdfKey, setActivePdfKey] = useState<string | null>(null);
  const [isExtractionEnabled, setIsExtractionEnabled] = useState(() => {
    return sessionStorage.getItem('extractImages') !== 'false';
  });
  const [extractionInProgress, setExtractionInProgress] = useState(false);

  // Load images when modal opens or when active PDF changes
  useEffect(() => {
    if (open) {
      setLoading(true);
      // Listen for PDF switch events
      const handlePdfSwitched = (e: CustomEvent) => {
        if (e.detail?.pdfKey) {
          loadImagesForPdf(e.detail.pdfKey);
        }
      };

      window.addEventListener('pdfSwitched', handlePdfSwitched as EventListener);
      
      // Load images for current PDF
      const loadCurrentPdfImages = async () => {
        // Get active PDF key from window or session storage
        const currentPdfKey = window.__ACTIVE_PDF_KEY__ || sessionStorage.getItem('currentPdfKey');
        
        if (currentPdfKey) {
          loadImagesForPdf(currentPdfKey);
        } else {
          // Get all PDFs from session storage as fallback
          const metas = getAllPdfs();
          if (metas.length > 0) {
            const pdfKey = getPdfKey(metas[0]);
            if (pdfKey) {
              loadImagesForPdf(pdfKey);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      };
      
      loadCurrentPdfImages();
      
      return () => {
        window.removeEventListener('pdfSwitched', handlePdfSwitched as EventListener);
      };
    }
  }, [open]);

  // Effect to update extraction setting in session storage
  useEffect(() => {
    sessionStorage.setItem('extractImages', isExtractionEnabled ? 'true' : 'false');
  }, [isExtractionEnabled]);

  // Helper function to get all PDFs from session storage
  const getAllPdfs = () => {
    const metas = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('pdfMeta_')) {
        try {
          const meta = JSON.parse(sessionStorage.getItem(key) || '');
          if (meta && meta.name) {
            metas.push(meta);
          }
        } catch (e) {
          console.error('Error parsing PDF metadata', e);
        }
      }
    }
    return metas;
  };

  // Load images for a specific PDF
  const loadImagesForPdf = async (pdfKey: string) => {
    setActivePdfKey(pdfKey);
    const extractedImages = getExtractedImages(pdfKey);
    setImages(extractedImages);
    setLoading(false);
  };

  // Force extract images from current PDF
  const handleForceExtract = async () => {
    if (!activePdfKey || extractionInProgress) return;
    
    try {
      setExtractionInProgress(true);
      // Get PDF data
      const pdfData = await getPdfData(activePdfKey);
      
      if (!pdfData) {
        throw new Error("Could not load PDF data");
      }
      
      // Extract images
      const extractedImages = await extractImagesFromPdf(pdfData);
      
      if (extractedImages.length > 0) {
        // Store extracted images
        storeExtractedImages(activePdfKey, extractedImages);
        // Update state
        setImages(extractedImages);
      }
      
    } catch (error) {
      console.error("Error extracting images:", error);
    } finally {
      setExtractionInProgress(false);
    }
  };

  // Download an individual image
  const downloadImage = (image: ExtractedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.alt.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render placeholder when no images are available
  const renderNoImages = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Camera className="h-16 w-16 mb-4 opacity-20" />
      <p className="text-lg font-medium">No images found in this PDF</p>
      <p className="text-sm mt-2 text-center max-w-md">
        This PDF doesn't contain any extractable images or image extraction wasn't enabled during upload.
      </p>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-4 flex items-center gap-2"
        onClick={handleForceExtract}
        disabled={extractionInProgress || !activePdfKey}
      >
        {extractionInProgress ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Extracting images...</span>
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            <span>Try to extract images now</span>
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Camera className="mr-2 h-5 w-5" /> 
              Image Gallery
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="extract-images"
                  checked={isExtractionEnabled}
                  onCheckedChange={setIsExtractionEnabled}
                />
                <Label htmlFor="extract-images" className="text-xs">Auto-extract images</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-8 hidden sm:flex"
                onClick={handleForceExtract}
                disabled={extractionInProgress || !activePdfKey}
              >
                {extractionInProgress ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs">Re-extract</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading images...</span>
            </div>
          ) : images.length > 0 ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(image => (
                <div key={image.id} className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={image.url} 
                      alt={image.alt} 
                      className="w-full h-48 object-contain bg-gray-100 hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1"
                      onClick={() => downloadImage(image)}
                      title="Download image"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2 text-sm bg-white">
                    <div className="font-medium text-center text-gray-700">{image.alt}</div>
                    <div className="text-xs text-center text-gray-500 mt-1">
                      {image.width}×{image.height} px
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderNoImages()
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGalleryModal;
