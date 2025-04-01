
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UseUploadReturn {
  upload: (file: File) => Promise<string | null>;
  fileUrl: string | null;
  isLoading: boolean;
  progress: number;
}

/**
 * Custom hook for handling file uploads
 */
export const useUpload = (): UseUploadReturn => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Upload a file and return its URL
   */
  const upload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Create a URL for the file
      const url = URL.createObjectURL(file);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setProgress(100);
      
      // Set the file URL
      setFileUrl(url);
      
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload error',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    upload,
    fileUrl,
    isLoading,
    progress
  };
};
