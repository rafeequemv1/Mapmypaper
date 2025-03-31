
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveGeminiAPIKey, checkGeminiAPIKey } from "@/services/geminiService";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyModal = ({ open, onOpenChange }: ApiKeyModalProps) => {
  const [apiKey, setApiKey] = useState<string>("AIzaSyDWXTmFBjvvpiws05s571DVsxlhmvezTbQ");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { toast } = useToast();

  // Automatically save the default key when the component mounts
  useEffect(() => {
    if (open) {
      // Set default API key
      setApiKey("AIzaSyDWXTmFBjvvpiws05s571DVsxlhmvezTbQ");
      
      // Automatically save the default key
      saveGeminiAPIKey("AIzaSyDWXTmFBjvvpiws05s571DVsxlhmvezTbQ");
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    }
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Using pre-configured API key for generating research paper flowcharts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="mt-2">Setting up default API key...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
