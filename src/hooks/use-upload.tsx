
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const upload = async (file: File): Promise<string | null> => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Simulate file upload - in a real app, this would be an API call
      // to a storage service like Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate a local URL for the file (in a real app, this would be the URL from the storage)
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgress(100);
      
      return url;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during file upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { upload, isLoading, progress, fileUrl };
}
