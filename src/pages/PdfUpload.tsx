
import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud } from "lucide-react";
import { storePDF as savePDF, clearPDF as clearPDFData } from '@/utils/pdfStorage';
import { useNavigate } from 'react-router-dom';

// Import our wrapper instead of the original
import StatsDisplayWrapper from '@/components/StatsDisplayWrapper';

// Create a simple extractTextFromPDF function since the service is missing
const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // In a real app, we would extract text from PDF
      // This is a placeholder that returns some sample text
      const text = `Sample text extracted from ${file.name}. 
      This is a placeholder since we don't have the real PDF extraction service.`;
      resolve(text);
    };
    reader.readAsArrayBuffer(file);
  });
};

const PdfUpload: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setPdfFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      toast({
        title: "No PDF Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Clear existing PDF data
      await clearPDFData();

      // Save the PDF file
      await savePDF(pdfFile);

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(pdfFile);
      setPdfText(extractedText);

      // Store PDF text in session storage
      sessionStorage.setItem('pdfText', extractedText);
      sessionStorage.setItem('pdfAvailable', 'true');

      toast({
        title: "Upload Successful",
        description: `${pdfFile.name} has been uploaded and processed.`,
      });

      // Redirect to the mindmap page using react-router
      navigate('/MindMap');
    } catch (error: any) {
      console.error("Error during upload and processing:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and process the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = async () => {
    // Clear PDF data from storage
    await clearPDFData();

    // Reset state
    setPdfFile(null);
    setPdfText('');

    // Clear session storage
    sessionStorage.removeItem('pdfText');
    sessionStorage.removeItem('pdfAvailable');

    toast({
      title: "Data Cleared",
      description: "All PDF data has been cleared.",
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Upload Your PDF</h1>

      {/* Dropzone or File Input */}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-6 w-full max-w-md text-center cursor-pointer ${isDragActive ? 'border-primary' : 'border-gray-400'}`}>
        <input {...getInputProps()} id="file-input" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
        <UploadCloud className="mx-auto h-6 w-6 text-gray-500 mb-2" />
        <p className="text-sm text-gray-500">
          {isDragActive ? "Drop the files here..." : `Drag 'n' drop some files here, or click to select files`}
        </p>
        <p className="mt-2 text-xs text-gray-500">Only PDF files will be accepted</p>
      </div>

      {/* Selected File Display */}
      {pdfFile && (
        <div className="mt-4 w-full max-w-md">
          <Label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
            Selected File:
          </Label>
          <Input
            type="text"
            id="file-name"
            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            value={pdfFile.name}
            readOnly
          />
        </div>
      )}

      {/* Upload and Clear Buttons */}
      <div className="mt-6 flex space-x-4">
        <Button onClick={handleUpload} disabled={isProcessing || !pdfFile}>
          {isProcessing ? (
            <>
              Processing...
            </>
          ) : (
            "Upload PDF"
          )}
        </Button>
        <Button variant="secondary" onClick={handleClear} disabled={isProcessing}>
          Clear Data
        </Button>
      </div>

      {/* PDF Text Display (Optional) */}
      {pdfText && (
        <div className="mt-6 w-full max-w-md">
          <Label htmlFor="pdf-content" className="block text-sm font-medium text-gray-700">
            Extracted Text:
          </Label>
          <Textarea
            id="pdf-content"
            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary resize-none"
            value={pdfText}
            readOnly
            rows={5}
          />
        </div>
      )}
      
      {/* Stats Display */}
      <StatsDisplayWrapper className="mt-6" />
    </div>
  );
};

export default PdfUpload;
