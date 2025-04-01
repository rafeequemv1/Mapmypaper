
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { generateMindMapFromText, extractAndStorePdfText } from "@/services/geminiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { UploadCloud } from "lucide-react";

const PdfUpload = () => {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState("");
  const { toast } = useToast();
  const { upload, fileUrl, isLoading, progress } = useUpload();
  const isMobile = useIsMobile();

  // Load PDF text from session storage on component mount
  useEffect(() => {
    const storedPdfText = sessionStorage.getItem("pdfText");
    if (storedPdfText) {
      setPdfText(storedPdfText);
    }
  }, []);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      console.log("File selected:", file.name);
    } else {
      setPdfFile(null);
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
    }
  };

  // Handle PDF upload
  const handleUpload = async () => {
    if (!pdfFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload the PDF file
      const url = await upload(pdfFile);
      if (url) {
        console.log("PDF uploaded successfully:", url);
        toast({
          title: "Upload successful",
          description: "Your PDF file has been uploaded."
        });
      } else {
        throw new Error("Failed to upload the PDF file.");
      }

      // Extract text from PDF
      setIsProcessing(true);
      const extractedText = await extractAndStorePdfText(pdfFile);
      setPdfText(extractedText);
      
      // Store the uploaded PDF data in session storage
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          sessionStorage.setItem("uploadedPdfData", reader.result as string);
          sessionStorage.setItem("pdfData", reader.result as string);
        }
      };
      reader.readAsDataURL(pdfFile);
      
      // Navigate to mindmap view
      navigate("/mindmap");
    } catch (error) {
      console.error("Error during upload and processing:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload the PDF file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual text submission
  const handleSubmitText = useCallback(async () => {
    if (!manualText.trim()) {
      toast({
        title: "No text entered",
        description: "Please enter text to generate the mind map.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate mind map data from manual text
      console.log("PDF processing started");
      const mindMapData = await generateMindMapFromText(manualText);
      console.log("Mind map data generated:", mindMapData ? "Successfully" : "Failed");
      setMindMapData(mindMapData);

      // Store the manual text and mind map data in session storage
      sessionStorage.setItem("pdfText", manualText);
      sessionStorage.setItem("mindMapData", JSON.stringify({
        nodeData: {
          id: 'root',
          topic: 'Mind Map',
          children: []
        }
      }));

      // Navigate to the mind map page
      navigate("/mindmap");
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast({
        title: "Failed to generate mind map",
        description: error instanceof Error ? error.message : "Failed to generate the mind map.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [manualText, navigate, toast]);

  return (
    <div className="container mx-auto py-10 flex flex-col gap-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Generate Mind Map</CardTitle>
          <CardDescription>
            Upload a PDF file or enter text manually to generate a mind map.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pdf">Upload PDF File</Label>
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <Button
              onClick={handleUpload}
              disabled={isProcessing || isLoading}
            >
              {isLoading ? (
                <>
                  Uploading...
                  <Progress className="w-full mt-2" value={progress} />
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
            
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Uploaded File
              </a>
            )}
          </div>
          
          <Separator />
          
          <div className="grid gap-2">
            <Label htmlFor="manual-text">Enter Text Manually</Label>
            <Textarea
              id="manual-text"
              placeholder="Enter text here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          
          <Button
            onClick={handleSubmitText}
            disabled={isProcessing}
          >
            {isProcessing ? "Generating..." : "Generate Mind Map"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfUpload;
