
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Download, Loader, Images, RefreshCw, AlertCircle } from "lucide-react";
import { ExtractedImage, getExtractedImages, extractImagesFromPdf, storeExtractedImages } from "@/utils/pdfImageExtractor";
import { Button } from "@/components/ui/button";
import { getPdfKey } from "@/components/PdfTabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getPdfData } from "@/utils/pdfStorage";
import { useToast } from "@/hooks/use-toast";

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
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load images when modal opens or when active PDF changes
  useEffect(() => {
    if (open) {
      setLoading(true);
      setExtractionError(null);
      
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
    setExtractionError(null);
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
      setExtractionError(null);
      
      // Get PDF data
      const pdfData = await getPdfData(activePdfKey);
      
      if (!pdfData) {
        throw new Error("Could not load PDF data");
      }

      toast({
        title: "Extracting images",
        description: "Please wait while we extract images from the PDF...",
      });
      
      // Extract images
      console.log("Starting image extraction for PDF:", activePdfKey);
      const extractedImages = await extractImagesFromPdf(pdfData);
      console.log("Image extraction complete, found:", extractedImages.length);
      
      if (extractedImages.length > 0) {
        // Store extracted images
        storeExtractedImages(activePdfKey, extractedImages);
        // Update state
        setImages(extractedImages);
        
        toast({
          title: "Success",
          description: `Extracted ${extractedImages.length} images from the PDF`,
        });
      } else {
        toast({
          title: "No images found",
          description: "No extractable images were found in this PDF",
          variant: "warning",
        });
      }
      
    } catch (error) {
      console.error("Error extracting images:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setExtractionError(`Failed to extract images: ${errorMessage}`);
      
      toast({
        title: "Extraction failed",
        description: "There was a problem extracting images from this PDF",
        variant: "destructive",
      });
    } finally {
      setExtractionInProgress(false);
    }
  };

  // Download an individual image
  const downloadImage = (image: ExtractedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `${image.alt.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Download failed",
        description: "Could not download the image",
        variant: "destructive",
      });
    }
  };

  // Render placeholder when no images are available
  const renderNoImages = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Camera className="h-16 w-16 mb-4 opacity-20" />
      <p className="text-lg font-medium">No images found in this PDF</p>
      <p className="text-sm mt-2 text-center max-w-md">
        This PDF doesn't contain any extractable images or image extraction wasn't enabled during upload.
      </p>
      
      {extractionError && (
        <Alert variant="destructive" className="mt-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Extraction Error</AlertTitle>
          <AlertDescription>
            {extractionError}
          </AlertDescription>
        </Alert>
      )}
      
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
            <RefreshCw className="h-4 w-4" />
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
              <Images className="mr-2 h-5 w-5" /> 
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
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs">Re-extract</span>
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            View and download images extracted from your PDF document
          </DialogDescription>
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
