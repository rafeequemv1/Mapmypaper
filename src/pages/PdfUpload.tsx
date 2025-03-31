
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Brain } from "lucide-react";
import "@/styles/landing.css";

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
        handleFileUpload(droppedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  }, []);
  
  // Handle manual file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        handleFileUpload(selectedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  }, []);
  
  // Process the PDF file
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          const base64Data = event.target.result.toString();
          
          try {
            // Store the PDF data in session storage
            sessionStorage.setItem('pdfData', base64Data);
            sessionStorage.setItem('uploadedPdfData', base64Data);
            sessionStorage.setItem('pdfFilename', uploadedFile.name);
            
            // Extract text from PDF
            await extractPdfText(base64Data);
            
            // Navigate to the mind map page
            navigate('/mindmap');
          } catch (error) {
            console.error("Error processing PDF:", error);
            setError("Failed to process the PDF. Please try a different file.");
            setIsUploading(false);
          }
        }
      };
      
      reader.onerror = () => {
        setError("Error reading the file. Please try again.");
        setIsUploading(false);
      };
      
      reader.readAsDataURL(uploadedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload the file. Please try again.");
      setIsUploading(false);
    }
  }, [navigate]);
  
  // Extract text content from PDF
  const extractPdfText = useCallback(async (pdfData: string) => {
    try {
      // We'll use PDF.js to extract text
      const pdf = await import('pdfjs-dist');
      const pdfjsLib = pdf.default;
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdf.version}/build/pdf.worker.min.js`;
      
      // Remove the data URL prefix if present
      const cleanPdfData = pdfData.includes('base64,') 
        ? atob(pdfData.split('base64,')[1])
        : pdfData;
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: cleanPdfData });
      const pdfDocument = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      // Store the extracted text in session storage
      sessionStorage.setItem('pdfText', fullText);
      
      return fullText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw new Error("Failed to extract text from the PDF");
    }
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-logo">
        <Brain size={40} />
        <span>MapMyPaper</span>
      </div>
      
      <p className="landing-tagline">
        Upload your academic paper or research document to automatically generate interactive mind maps, summaries, and AI-powered insights
      </p>
      
      <div className="landing-upload">
        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Processing PDF, please wait...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                {file ? (
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-10 w-10" />
                    <span className="text-lg font-medium">{file.name}</span>
                  </div>
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground/70" />
                )}
              </div>
              
              <p className="text-lg font-medium mb-2">
                {file ? 'File ready for upload' : 'Drag and drop your PDF here'}
              </p>
              
              <p className="text-muted-foreground mb-4">
                {file 
                  ? 'Click upload to continue' 
                  : 'or select a file from your computer'
                }
              </p>
              
              <label 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 cursor-pointer"
              >
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileSelect}
                />
                {file ? 'Choose another file' : 'Select PDF'}
              </label>
              
              {error && (
                <p className="text-destructive mt-4">{error}</p>
              )}
              
              {file && !error && (
                <button 
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 w-full"
                  onClick={() => handleFileUpload(file)}
                >
                  Upload and Create Mind Map
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
