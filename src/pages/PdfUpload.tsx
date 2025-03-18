import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import { saveMindMapData } from "@/lib/utils";

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileError, setShowFileError] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const debouncedTitle = useDebounce(title, 500);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFile(file);
      setFileName(file.name);
      setPdfText('');
      setIsExtracting(true);
      setError(null);
      setShowFileError(false);

      // Store the PDF in sessionStorage for viewing in the MindMap page
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64data = e.target?.result as string;
        sessionStorage.setItem('uploadedPdfData', base64data);
      };
      reader.readAsDataURL(file);

      // Extract text from PDF
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const pdf = await import('pdf-parse');
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const data = await pdf(arrayBuffer);
          setPdfText(data.text);
          setIsExtracting(false);
          setProgress(100);
          toast({
            title: "PDF Uploaded",
            description: "Your PDF has been uploaded and is ready to be processed."
          });
        } catch (err) {
          console.error("Error extracting text from PDF:", err);
          setError("Failed to extract text from PDF. Please try again.");
          setIsExtracting(false);
          setProgress(0);
        }
      };

      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setProgress(percentage);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } else {
      setFile(null);
      setFileName('');
      setPdfText('');
      setIsExtracting(false);
      setError("Please select a valid PDF file.");
      setShowFileError(true);
      setProgress(0);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const generateMindMap = useCallback(async () => {
    if (!pdfText) {
      setError("Please upload a PDF file before generating the mind map.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfText, title: debouncedTitle }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Mind map data from Gemini:", data);

      // Save the mind map data to session storage
      saveMindMapData(data);

      setIsExtracting(false);
      navigate('/mindmap');
    } catch (err: any) {
      console.error("Error generating mind map:", err);
      setError(`Failed to generate mind map: ${err.message}`);
      setIsExtracting(false);
    }
  }, [pdfText, debouncedTitle, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - thin and black */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-medium text-white">PaperMind</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Your Research Paper</CardTitle>
            <CardDescription>
              Transform your research into an interactive mind map.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* File Upload Section */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="pdf-file">PDF File</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isExtracting}
                className="cursor-pointer"
              />
              {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
              {showFileError && error && (
                <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {error}</p>
              )}
            </div>

            {/* Title Input */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                type="text"
                id="title"
                placeholder="Enter a title for your mind map"
                value={title}
                onChange={handleTitleChange}
                disabled={isExtracting}
              />
              <p className="text-sm text-muted-foreground">
                A title can help to focus the AI on the core aspects of your research.
              </p>
            </div>

            {/* Progress Bar */}
            {isExtracting && (
              <div className="flex flex-col space-y-1.5">
                <Label>Extracting Text</Label>
                <Progress value={progress} />
              </div>
            )}

            {/* PDF Text Preview */}
            {pdfText && (
              <div className="flex flex-col space-y-1.5">
                <Label>PDF Content Preview</Label>
                <Textarea
                  value={pdfText}
                  readOnly
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}

            {error && !showFileError && (
              <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={generateMindMap} disabled={isExtracting || !file}>
              Generate Mind Map
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-2 px-8 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              PaperMind Mapper — Transform research into visual knowledge
            </p>
            <Separator className="md:hidden" />
            <div className="text-sm text-muted-foreground">
              © 2023 PaperMind
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
