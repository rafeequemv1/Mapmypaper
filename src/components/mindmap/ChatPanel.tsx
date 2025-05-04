import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, FileText, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini, explainSelectedText } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import ChatToolbar from "./ChatToolbar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAllPdfs } from "@/components/PdfTabs";
import { pdfjs } from 'pdfjs-dist';
import MessageEmpty from "./MessageEmpty";

// Initialize PDF.js worker using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  explainImage?: string;
  onScrollToPdfPosition?: (position: string) => void;
  onExplainText?: (text: string) => void;
  onPdfPlusClick?: () => void;
  activePdfKey: string | null;
  allPdfKeys: string[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  toggleChat,
  explainText,
  explainImage,
  onScrollToPdfPosition,
  onExplainText,
  onPdfPlusClick,
  activePdfKey,
  allPdfKeys
}) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'assistant' | 'system'; 
    content: string; 
    isHtml?: boolean; 
    image?: string; 
    pdfKey?: string | null;
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
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [processingExplainImage, setProcessingExplainImage] = useState(false);
  const [useAllPapers, setUseAllPapers] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [pdfText, setPdfText] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle PDF switching by adding a system message
  useEffect(() => {
    if (activePdfKey) {
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
  }, [activePdfKey]);

  // Process text to explain when it changes
  useEffect(() => {
    const processExplainText = async () => {
      if (explainText && !processingExplainText) {
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
          // Use the explainSelectedText function directly from geminiService
          const response = await explainSelectedText(explainText);
          
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
  }, [explainText, toast, activePdfKey, useAllPapers, allPdfKeys]);

  // Process image to explain when it changes
  useEffect(() => {
    const processExplainImage = async () => {
      if (explainImage && !processingExplainImage) {
        setProcessingExplainImage(true);
        
        // Add user message with the selected area image
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: "Please explain this selected area from the document:", 
          image: explainImage,
          pdfKey: activePdfKey
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Build the prompt with context
          let prompt = "Please explain the content visible in this image from the document. Describe what you see in detail. Include any relevant information, concepts, diagrams, or text visible in this selection.";
          
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
          console.error("Image analysis error:", error);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: "Sorry, I encountered an error analyzing this image. Please try again.",
              pdfKey: activePdfKey
            }
          ]);
          
          toast({
            title: "Chat Error",
            description: "Failed to get a response from the AI.",
            variant: "destructive"
          });
        } finally {
          setProcessingExplainImage(false);
        }
      }
    };
    
    processExplainImage();
  }, [explainImage, toast, activePdfKey, useAllPapers, allPdfKeys]);

  // Activate citations in messages when they are rendered
  useEffect(() => {
    // Use a longer timeout to ensure the DOM is fully rendered
    const activationTimeout = setTimeout(() => {
      const messageContainers = document.querySelectorAll('.ai-message-content');
      
      messageContainers.forEach(container => {
        activateCitations(container as HTMLElement, (citation) => {
          console.log("Desktop Citation clicked:", citation);
          if (onScrollToPdfPosition) {
            // Directly invoke the scroll function with sufficient delay to ensure proper handling
            onScrollToPdfPosition(citation);
          }
        });
      });
    }, 200); // Increased timeout for more reliable activation
    
    return () => clearTimeout(activationTimeout);
  }, [messages, onScrollToPdfPosition]);

  // New function to extract text from PDF with better error handling
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // Convert the file to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document using the correct API
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      
      // Add explicit error handling for worker
      loadingTask.onUnsupportedFeature = (feature) => {
        console.warn('Unsupported PDF feature:', feature);
      };
      
      let pdf;
      try {
        pdf = await loadingTask.promise;
      } catch (workerError) {
        console.error('PDF.js worker error:', workerError);
        toast({
          title: "PDF Worker Error",
          description: "The PDF processing worker failed to load. Please try again.",
          variant: "destructive"
        });
        return `Could not extract text from PDF: PDF.js worker failed to initialize. Error: ${workerError.message}`;
      }
      
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
    } catch (error: any) {
      console.error('Error extracting text from PDF:', error);
      return `Could not extract text from PDF: ${error.message}`;
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
        prompt += ` Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to make your response more engaging.`;
        
        // If using all papers, add that context to the prompt
        if (useAllPapers && allPdfKeys.length > 1) {
          prompt = `Consider all uploaded documents when answering. ${prompt}`;
        }
        
        // Make sure this is using the updated chatWithGeminiAboutPdf function
        const response = await chatWithGeminiAboutPdf(prompt);
        
        // Hide typing indicator and add AI response with enhanced formatting
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

  // Handle file attachment
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  // New functions for toolbar actions
  const handleAnalyzeImage = () => {
    // Open file picker limited to images
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          if (event.target?.result) {
            const imageData = event.target.result as string;
            
            // Add user message with image
            setMessages(prev => [...prev, { 
              role: 'user', 
              content: "Please analyze this image:", 
              image: imageData,
              pdfKey: activePdfKey
            }]);
            
            // Show typing indicator
            setIsTyping(true);
            
            try {
              // Call the Gemini Vision API
              const response = await analyzeImageWithGemini(imageData);
              
              // Add AI response
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
              console.error("Image analysis error:", error);
              setIsTyping(false);
              setMessages(prev => [
                ...prev, 
                { 
                  role: 'assistant', 
                  content: "Sorry, I encountered an error analyzing this image. Please try again.",
                  pdfKey: activePdfKey
                }
              ]);
              
              toast({
                title: "Analysis Error",
                description: "Failed to analyze the image.",
                variant: "destructive"
              });
            }
          }
        };
        
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSummarizeText = async () => {
    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: "Please summarize the main points of this document.",
      pdfKey: activePdfKey
    }]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Build the prompt with context
      let prompt = `Summarize the main points of this document in a clear, structured way. Include key findings, methodologies, and conclusions. Format your response with markdown headings and bullet points for clarity. Add relevant emojis to make the summary more engaging.`;
      
      // If using all papers, adjust the prompt
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
    } catch (error) {
      // Handle errors
      setIsTyping(false);
      console.error("Summarization error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I encountered an error summarizing the document. Please try again.",
          pdfKey: activePdfKey
        }
      ]);
      
      toast({
        title: "Summarization Error",
        description: "Failed to summarize the document.",
        variant: "destructive"
      });
    }
  };

  // Show message empty state if no PDF is available
  if (allPdfKeys.length === 0 || !activePdfKey) {
    return (
      <div className="flex flex-col h-full border-l">
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h3 className="font-medium text-sm">Research Assistant</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={toggleChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <MessageEmpty onUploadClick={onPdfPlusClick} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l">
      {/* File input for attachments (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />
      
      {/* Chat panel header */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="font-medium text-sm">Research Assistant</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={toggleChat}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* All papers toggle */}
      {allPdfKeys.length > 1 && (
        <div className="flex items-center justify-between p-2 px-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <Label htmlFor="use-all-papers" className="text-sm text-gray-700 cursor-pointer">
              Use all papers for answers
            </Label>
          </div>
          <Switch
            id="use-all-papers"
            checked={useAllPapers}
            onCheckedChange={setUseAllPapers}
          />
        </div>
      )}
      
      {/* ChatToolbar with new props */}
      <ChatToolbar 
        onAnalyzeImage={handleAnalyzeImage} 
        onSummarizeText={handleSummarizeText} 
      />
      
      {/* Chat messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input area with file preview */}
      <div className="p-3 border-t bg-white">
        {/* File preview area */}
        {attachedFile && (
          <div className="mb-2 p-2 bg-gray-50 rounded-md border flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {fileType.startsWith('image/') && filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="h-10 w-10 object-cover rounded"
                />
              ) : fileType === 'application/pdf' ? (
                <FileText className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-gray-500" />
              )}
              <div className="truncate">
                <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(attachedFile.size / 1024).toFixed(1)} KB
                  {fileType === 'application/pdf' && pdfText ? ' • PDF text extracted' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0
