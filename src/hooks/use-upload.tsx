
import { useState } from "react";
import { useToast } from "./use-toast";

export function useUpload() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const upload = async (file: File): Promise<string | null> => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setProgress(0);
    
    try {
      // Create a FileReader to read the file as a Data URL (base64)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 100);
            setProgress(percentLoaded);
          }
        };
        
        reader.onload = () => {
          // Success - we have the data URL
          const dataUrl = reader.result as string;
          setFileUrl(dataUrl);
          setIsLoading(false);
          setProgress(100);
          resolve(dataUrl);
        };
        
        reader.onerror = () => {
          setIsLoading(false);
          reject(new Error("Failed to read file"));
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
      });
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during upload",
        variant: "destructive",
      });
      return null;
    }
  };

  return { upload, fileUrl, isLoading, progress };
}
