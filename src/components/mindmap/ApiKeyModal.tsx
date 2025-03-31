
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
  const [apiKey, setApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { toast } = useToast();

  // Check for existing key in localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem("GOOGLE_API_KEY");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, [open]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a Google Gemini API key",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // Temporarily save the key
      saveGeminiAPIKey(apiKey);
      
      // Validate the key with a test request
      const isValid = await checkGeminiAPIKey();
      
      if (isValid) {
        setIsSaving(true);
        // Save the API key permanently
        saveGeminiAPIKey(apiKey);
        
        toast({
          title: "API Key Saved",
          description: "Your Google Gemini API key has been saved successfully.",
        });
        
        // Close the modal
        onOpenChange(false);
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is invalid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      toast({
        title: "Validation Error",
        description: "Failed to validate the API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API key to use AI features. You can get an API key from the
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline ml-1"
            >
              Google AI Studio
            </a>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              disabled={isSaving || isValidating}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Your API key is stored locally in your browser and is never sent to our servers.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving || isValidating}
            className="w-full sm:w-auto"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
