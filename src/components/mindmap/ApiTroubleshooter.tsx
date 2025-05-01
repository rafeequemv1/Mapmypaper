
import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testGeminiConnection } from "@/services/geminiService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiTroubleshooterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiTroubleshooter: React.FC<ApiTroubleshooterProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runApiTest = async () => {
    setTestStatus('loading');
    setErrorMessage(null);
    
    try {
      await testGeminiConnection();
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to connect to Gemini API");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>API Connection Troubleshooter</DialogTitle>
          <DialogDescription>
            Test your connection to the Gemini API and diagnose common issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">1. Check your API key</h3>
            <p className="text-sm text-gray-500">
              Ensure you have set the <code>VITE_GEMINI_API_KEY</code> in your .env file
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">2. Test API connection</h3>
            <Button 
              onClick={runApiTest}
              disabled={testStatus === 'loading'}
              variant="outline"
              className="w-full"
            >
              {testStatus === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing connection...
                </>
              ) : 'Test API Connection'}
            </Button>
          </div>

          {testStatus === 'success' && (
            <Alert variant="success" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Connection successful</AlertTitle>
              <AlertDescription>
                Your Gemini API connection is working correctly.
              </AlertDescription>
            </Alert>
          )}

          {testStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription>
                {errorMessage || "Failed to connect to Gemini API"}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium">Common issues:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500">
              <li>Missing or invalid API key</li>
              <li>Network connectivity issues</li>
              <li>API rate limits exceeded</li>
              <li>Gemini API service disruption</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiTroubleshooter;
