import { MessageSquare, Copy, Check, FileText, Paperclip, X, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAllPdfs } from "@/components/PdfTabs";
import { pdfjs } from 'react-pdf';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface MobileChatSheetProps {
  onScrollToPdfPosition?: (position: string) => void;
  explainText?: string;
  activePdfKey: string | null;
  allPdfKeys: string[];
}

const MobileChatSheet = ({ 
  onScrollToPdfPosition, 
  explainText, 
  activePdfKey,
  allPdfKeys 
}: MobileChatSheetProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'assistant' | 'system'; 
    content: string; 
    isHtml?: boolean;
    pdfKey?: string | null;
    image?: string;
    attachedFile?: File | null;
    filePreview?: string | null;
    fileType?: string;
    pdfText?: string | null;
  }[]>([
    { 
      role: 'assistant', 
      content: `Hello! 👋 I'm your research assistant. Ask me questions about the document you uploaded. I can provide **citations** to help you find information in the document.

Feel free to ask me any questions! Here are some suggestions:` 
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const citationActivated = useRef(false);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [useAllPapers, setUseAllPapers] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [pdfText, setPdfText] = useState<string | null>(null);
  
  // Handle PDF switching by adding a system message
  useEffect(() => {
    if (activePdfKey && isSheetOpen) {
      const pdfs = getAllPdfs();
      const currentPdf = pdfs.find(pdf => pdf.name === activePdfKey.split('_')[0]);
      
      if (currentPdf) {
        const systemMessage = {
          role: 'system' as const,
          content: `You are now discussing the PDF: "${currentPdf.name}". Your responses should focus on this document.`,
          pdfKey: activePdfKey
        };
        
        setMessages(prev => {
          // Only add the system message if the last message wasn't already about this PDF
          const lastSystemMsg = [...prev].reverse().find(msg => msg.role === 'system' && msg.pdfKey);
          if (!lastSystemMsg || lastSystemMsg.pdfKey !== activePdfKey) {
            return [...prev, systemMessage];
          }
          return prev;
        });
      }
    }
  }, [activePdfKey, isSheetOpen]);
  
  // Activate citations in messages when they are rendered
  useEffect(() => {
    if (isSheetOpen && !citationActivated.current) {
      const activationTimeout = setTimeout(() => {
        try {
          const messageContainers = document.querySelectorAll('.ai-message-content');
          
          messageContainers.forEach(container => {
            activateCitations(container as HTMLElement, (citation) => {
              console.log("Mobile Citation clicked:", citation);
              if (onScrollToPdfPosition) {
                onScrollToPdfPosition(citation);
                // Small delay to ensure event is processed before closing sheet
                setTimeout(() => {
                  setIsSheetOpen(false); // Close sheet after citation click on mobile
                }, 50);
              }
            });
          });
          
          citationActivated.current = true;
        } catch (error) {
          console.error("Error activating citations:", error);
        }
      }, 300); // Increased timeout to ensure DOM is fully ready
      
      return () => {
        clearTimeout(activationTimeout);
      };
    }
    
    // Reset citation activation when sheet closes
    if (!isSheetOpen) {
      citationActivated.current = false;
    }
  }, [messages, isSheetOpen, onScrollToPdfPosition]);
  
  // Process text to explain when it changes
  useEffect(() => {
    const processExplainText = async () => {
      if (explainText && !processingExplainText && isSheetOpen) {
        setProcessingExplainText(true);
        
        // Set the text in the input field first
        setInputValue(`Please explain this text: "${explainText}"`);
        
        // Add user message with the selected text
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: `Please explain this text: "${explainText}"`,
          pdfKey: activePdfKey 
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Build the prompt with context
          let prompt = `Please explain this text in detail. Use complete sentences with relevant emojis and provide specific page citations in [citation:pageX] format: "${explainText}". Add emojis relevant to the content.`;
          
          // If using all papers, add that context to the prompt
          if (useAllPapers && allPdfKeys.length > 1) {
            prompt = `Consider all uploaded documents when answering. ${prompt}`;
          }
          
          // Call the API with the prompt
          const response = await chatWithGeminiAboutPdf(prompt);
          
          // Hide typing indicator and add AI response with formatting
          setIsTyping(false);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: formatAIResponse(response),
              isHtml: true,
              pdfKey: activePdfKey
            }
          ]);
        } catch (error) {
          // Handle errors
          setIsTyping(false);
          console.error("Chat error:", error);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: "Sorry, I encountered an error explaining that. Please try again.",
              pdfKey: activePdfKey
            }
          ]);
          
          toast({
            title: "Explanation Error",
            description: "Failed to get an explanation from the AI.",
            variant: "destructive"
          });
        } finally {
          setProcessingExplainText(false);
        }
      }
    };
    
    processExplainText();
  }, [explainText, isSheetOpen, toast, activePdfKey, useAllPapers, allPdfKeys]);
  
  // New function to extract text from PDF
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // Convert the file to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document using the correct API
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `Page ${i}: ${pageText}\n\n`;
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return `Could not extract text from PDF: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() || attachedFile) {
      // Add user message with possible attachment
      const userMessage = inputValue.trim();
      const newUserMessage = { 
        role: 'user' as const, 
        content: userMessage || (attachedFile ? `Attached file: ${attachedFile.name}` : ""),
        pdfKey: activePdfKey,
        attachedFile: attachedFile,
        filePreview: filePreview,
        fileType: fileType,
        pdfText: pdfText
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      // Clear input and attachment
      setInputValue('');
      setAttachedFile(null);
      setFilePreview(null);
      setPdfText(null);
      setFileType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Build the prompt with context, including PDF text if available
        let prompt = `${userMessage}`;
        
        if (attachedFile) {
          if (fileType === 'application/pdf' && pdfText) {
            prompt = `I've attached a PDF named ${attachedFile.name}. Here's the extracted text from it:\n\n${pdfText}\n\nPlease respond to this: ${userMessage || 'Could you analyze this PDF?'}`;
          } else if (fileType.startsWith('image/')) {
            prompt = `I've attached an image named ${attachedFile.name}. ${userMessage || 'Could you describe what you see in this image?'}`;
          } else {
            prompt = `I've attached a file named ${attachedFile.name}. ${userMessage || 'Can you help me with this file?'}`;
          }
        }
        
        // Add citation instructions
        prompt += ` Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to your response to make it more engaging.`;
        
        if (useAllPapers && allPdfKeys.length > 1) {
          prompt = `Consider all uploaded documents when answering. ${prompt}`;
        }
        
        // Call the API with the prompt
        const response = await chatWithGeminiAboutPdf(prompt);
        
        // Hide typing indicator and add AI response with formatting
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: formatAIResponse(response),
            isHtml: true,
            pdfKey: useAllPapers ? 'all' : activePdfKey
          }
        ]);
        
        // Reset citation activation flag so citations are processed on the new message
        citationActivated.current = false;
      } catch (error) {
        // Handle errors
        setIsTyping(false);
        console.error("Chat error:", error);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "Sorry, I encountered an error. Please try again.",
            pdfKey: activePdfKey
          }
        ]);
        
        toast({
          title: "Chat Error",
          description: "Failed to get a response from the AI.",
          variant: "destructive"
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, messageId: number) => {
    try {
      // Strip HTML tags for copying plain text
      const plainText = text.replace(/<[^>]*>?/gm, '');
      
      navigator.clipboard.writeText(plainText).then(() => {
        setCopiedMessageId(messageId);
        
        toast({
          title: "Copied to clipboard",
          description: "Message content has been copied",
          duration: 2000,
        });
        
        // Reset the copied icon after 2 seconds
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    // Reset when closing
    if (!open) {
      citationActivated.current = false;
    }
    setIsSheetOpen(open);
  };

  const handleQuickQuestion = async (question: string) => {
    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: question,
      pdfKey: activePdfKey
    }]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Build the prompt with context
      let prompt = `${question} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to make your response more engaging.`;
      
      if (useAllPapers && allPdfKeys.length > 1) {
        prompt = `Consider all uploaded documents when answering. ${prompt}`;
      }
      
      // Call the API with the prompt
      const response = await chatWithGeminiAboutPdf(prompt);
      
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: formatAIResponse(response),
          isHtml: true,
          pdfKey: useAllPapers ? 'all' : activePdfKey
        }
      ]);
    } catch (error) {
      setIsTyping(false);
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I encountered an error. Please try again.",
          pdfKey: activePdfKey
        }
      ]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive"
      });
    }
  };

  // Handle file selection - enhanced to handle PDFs and images differently
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      
      // Determine file type
      const type = file.type;
      setFileType(type);
      
      if (type.startsWith('image/')) {
        // For image files, create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFilePreview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
        setPdfText(null);
      } 
      else if (type === 'application/pdf') {
        // For PDF files, create a thumbnail and extract text
        try {
          // Create PDF thumbnail
          const pdfUrl = URL.createObjectURL(file);
          setFilePreview(pdfUrl);
          
          // Extract text from PDF
          const extractedText = await extractTextFromPdf(file);
          setPdfText(extractedText);
          
          console.log('Extracted PDF text:', extractedText.substring(0, 200) + '...');
        } catch (error) {
          console.error('Error processing PDF:', error);
          toast({
            title: "PDF Processing Error",
            description: "Failed to process the PDF file properly.",
            variant: "destructive"
          });
        }
      } 
      else {
        // For other file types, just show the name
        setFilePreview(null);
        setPdfText(null);
      }
      
      toast({
        title: "File attached",
        description: `${file.name} added to your message`,
      });
    }
  };
  
  // Remove attached file
  const removeAttachedFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    setPdfText(null);
    setFileType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle attachment
  const handleAttachment = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get PDF name from key for display
  const getPdfNameFromKey = (key: string | null | undefined): string => {
    if (!key) return "Unknown PDF";
    if (key === 'all') return "All PDFs";
    
    const pdfs = getAllPdfs();
    const match = pdfs.find(pdf => 
      pdf.name === key.split('_')[0]
    );
    
    return match ? match.name : "Unknown PDF";
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button 
          className="fixed right-4 bottom-4 rounded-full h-12 w-12 md:hidden shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h3 className="font-medium text-sm">Research Assistant</h3>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />
        
        {/* All papers toggle */}
        {allPdfKeys.length > 1 && (
          <div className="flex items-center justify-between p-2 px-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <Label htmlFor="mobile-use-all-papers" className="text-sm text-gray-700 cursor-pointer">
                Use all papers for answers
              </Label>
            </div>
            <Switch
              id="mobile-use-all-papers"
              checked={useAllPapers}
              onCheckedChange={setUseAllPapers}
            />
          </div>
        )}
        
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, i) => {
              // Skip system messages from rendering
              if (message.role === 'system') return null;
              
              return (
                <div key={i} className="group relative">
                  {/* Show PDF context indicator for multi-PDF mode */}
                  {message.pdfKey && allPdfKeys.length > 1 && (
                    <div className="text-xs text-gray-500 mb-1">
                      {message.role === 'user' ? 'Asking about' : 'Answering from'}: {getPdfNameFromKey(message.pdfKey)}
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' 
                        : 'ai-message bg-gray-50 border border-gray-100 shadow-sm'
                    }`}
                  >
                    {/* Display attached image if present */}
                    {message.image && (
                      <div className="mb-2">
                        <img 
                          src={message.image} 
                          alt="Selected area" 
                          className="max-w-full rounded-md border border-gray-200"
                          style={{ maxHeight: '300px' }} 
                        />
                      </div>
                    )}
                    
                    {/* Display attached file preview */}
                    {message.filePreview && message.fileType?.startsWith('image/') && (
                      <div className="mb-2">
                        <img 
                          src={message.filePreview} 
                          alt="Attached image" 
                          className="max-w-full rounded-md border border-gray-200"
                          style={{ maxHeight: '300px' }} 
                        />
                      </div>
                    )}
                    
                    {/* Display PDF thumbnail */}
                    {message.filePreview && message.fileType === 'application/pdf' && (
                      <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded-md border">
                        <FileText className="h-10 w-10 text-red-500" />
                        <div>
                          <p className="font-medium">{message.attachedFile?.name}</p>
                          <p className="text-xs text-gray-500">
                            PDF Document {message.attachedFile && 
                              `(${(message.attachedFile.size / 1024).toFixed(1)} KB)`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display other attached file information */}
                    {message.attachedFile && !message.filePreview && (
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          {message.attachedFile.name} ({(message.attachedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    )}
                    
                    {message.isHtml ? (
                      <div 
                        className="ai-message-content" 
                        dangerouslySetInnerHTML={{ __html: message.content }} 
                      />
                    ) : (
                      message.content
                    )}

                    {i === 0 && (
                      <div className="mt-4 space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => handleQuickQuestion("What are the main topics covered in this paper?")}
                        >
                          What are the main topics covered in this paper?
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => handleQuickQuestion("Can you summarize the key findings?")}
                        >
                          Can you summarize the key findings?
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => handleQuickQuestion("What are the research methods used?")}
                        >
                          What are the research methods used?
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => handleQuickQuestion("What are the limitations of this study?")}
                        >
                          What are the limitations of this study?
                        </Button>
                      </div>
                    )}
                    
                    {message.role === 'assistant' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content, i)}
                      >
                        {copiedMessageId === i ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="ai-message bg-gray-50 border border-gray-100 shadow-sm rounded-lg p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t mt-auto">
          {/* File preview area */}
          {attachedFile && (
            <div className="mb-2 p-2 bg-gray-50 rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {fileType.startsWith('image/') && filePreview ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : fileType === 'application/pdf' ? (
                  <FileText className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}
                <div className="truncate">
                  <p className="text-xs font-medium truncate">{attachedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(attachedFile.size / 1024).toFixed(1)} KB
                    {fileType === 'application/pdf' && pdfText ? ' • PDF text extracted' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={removeAttachedFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border p-2 text-sm min-h-10 max-h-32 resize-none"
              placeholder={`Ask about ${useAllPapers ? 'all documents' : 'the document'}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div className="flex flex-col gap-2">
              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleAttachment}
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                className="shrink-0" 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !attachedFile}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileChatSheet;
