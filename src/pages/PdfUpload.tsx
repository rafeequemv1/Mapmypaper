import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUpload } from "@/hooks/use-upload";
import { generateMindMapFromText } from "@/services/geminiService";

const PdfUpload = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { upload, fileUrl, isLoading: isUploadLoading, progress } = useUpload();

  // Handle file selection
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPdfFile(file || null);
  }, []);

  // Handle manual text input
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualText(event.target.value);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    if (!pdfFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fileUrl = await upload(pdfFile);
      if (fileUrl) {
        // Store the file URL and other data in session storage
        sessionStorage.setItem("uploadedPdfData", fileUrl);
        sessionStorage.removeItem("pdfData"); // Ensure only one PDF source is active
        sessionStorage.removeItem("pdfText"); // Clear any existing text
        sessionStorage.removeItem("mindMapData"); // Clear existing mind map data
        
        toast({
          title: "File uploaded",
          description: "The PDF file has been uploaded successfully.",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "There was an error uploading the PDF file.",
          variant: "destructive"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, upload, toast]);

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
      sessionStorage.setItem("mindMapData", JSON.stringify(mindMapData));
      
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF to Mind Map Generator</h1>

      {/* Upload PDF Section */}
      <Card className="mb-4">
        <CardHeader>
          <Label htmlFor="pdf-upload">Upload PDF</Label>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <Button onClick={handleFileUpload} disabled={isProcessing || isUploadLoading}>
              {isUploadLoading ? `Uploading... ${progress}%` : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Text Input Section */}
      <Card>
        <CardHeader>
          <Label htmlFor="manual-text">Enter Text Manually</Label>
        </CardHeader>
        <CardContent>
          <Textarea
            id="manual-text"
            placeholder="Enter text here..."
            className="mb-4"
            rows={5}
            value={manualText}
            onChange={handleTextChange}
            disabled={isProcessing}
          />
          <Button onClick={handleSubmitText} disabled={isProcessing}>
            {isProcessing ? "Generating..." : "Generate Mind Map"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfUpload;
