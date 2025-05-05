import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini, analyzeFileWithGemini } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import { Switch } from "@/components/ui/switch";
import PdfToText from "react-pdftotext";
import { storePdfData, getPdfData, isMindMapReady } from "@/utils/pdfStorage";
import { generateMindMapFromText } from "@/services/geminiService";
import { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  explainImage?: string;
  onScrollToPdfPosition?: (position: string) => void;
  onExplainText?: (text: string) => void;
}

const ChatPanel = ({ toggleChat, explainText, explainImage, onScrollToPdfPosition }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean; image?: string, filename?: string, filetype?: string }[]>([
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
  // New state for the PDF toggle
  const [useAllPdfs, setUseAllPdfs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New states for file attachment preview
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const [attachedFileType, setAttachedFileType] = useState<string | null>(null);
  const [processingPdf, setProcessingPdf] = useState(false);

  // Listen for toggle state changes from mobile chat
  useEffect(() => {
    const handleToggleChange = (e: CustomEvent) => {
      if (e.detail?.useAllPdfs !== undefined) {
        setUseAllPdfs(e.detail.useAllPdfs);
      }
    };
    
    window.addEventListener('chatToggleChanged', handleToggleChange as EventListener);
    
    return () => {
      window.removeEventListener('chatToggleChanged', handleToggleChange as EventListener);
    };
  }, []);

  // Broadcast toggle state changes
  useEffect(() => {
    // Emit event when toggle changes so mobile chat can sync
    window.dispatchEvent(
      new CustomEvent('chatToggleChanged', { 
        detail: { useAllPdfs } 
      })
    );
  }, [useAllPdfs]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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
          content: `Please explain this text: "${explainText}"` 
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Enhanced prompt to encourage complete sentences and page citations
          // Now passing the useAllPdfs parameter
          const response = await chatWithGeminiAboutPdf(
            `Please explain this text in detail. Use complete sentences with relevant emojis and provide specific page citations in [citation:pageX] format: "${explainText}". Add emojis relevant to the content.`,
            useAllPdfs
          );
          
          // Hide typing indicator and add AI response with formatting
          setIsTyping(false);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: formatAIResponse(response),
              isHtml: true 
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
              content: "Sorry, I encountered an error. Please try again." 
            }
          ]);
          
          toast({
            title: "Chat Error",
            description: "Failed to get a response from the AI.",
            variant: "destructive"
          });
        } finally {
          setProcessingExplainText(false);
        }
      }
    };
    
    processExplainText();
  }, [explainText, toast, useAllPdfs]);

  // Process image to explain when it changes
  useEffect(() => {
    const processExplainImage = async () => {
      if (explainImage && !processingExplainImage) {
        setProcessingExplainImage(true);
        
        // Add user message with the selected area image
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: "Please explain this selected area from the document:", 
          image: explainImage 
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Call AI with the image
          // Here we're using the existing chatWithGeminiAboutPdf function
          // In a real implementation, you would want to modify this to accept an image
          // or create a new function that can process images
          const response = await chatWithGeminiAboutPdf(
            "Please explain the content visible in this image from the document. Describe what you see in detail. Include any relevant information, concepts, diagrams, or text visible in this selection.",
            useAllPdfs
          );
          
          // Hide typing indicator and add AI response with formatting
          setIsTyping(false);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: formatAIResponse(response),
              isHtml: true 
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
              content: "Sorry, I encountered an error. Please try again." 
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
  }, [explainImage, toast, useAllPdfs]);

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

  // Modified function to process PDF file without creating mindmap
  const processPdfFile = async (file: File) => {
    setProcessingPdf(true);
    
    try {
      // Add user message about PDF upload
      setMessages(prev => [...prev, { 
        role: 'user',
        content: `I've uploaded a PDF: "${file.name}" for context`,
        filename: file.name,
        filetype: file.type
      }]);
      
      // Show typing indicator for PDF processing
      setIsTyping(true);
      
      // Extract text from PDF
      const extractedText = await PdfToText(file);
      
      if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          role: 'assistant',
          content: "I couldn't extract any text from this PDF. It might be an image-based or scanned document.",
        }]);
        setProcessingPdf(false);
        return;
      }
      
      // Add success message
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant',
        content: formatAIResponse(`📄 **PDF Processed Successfully!**

I've analyzed "${file.name}" and can now discuss its contents. How can I help you with this document? You can ask me:

- To summarize key points
- Explain specific sections
- Compare it with the main document
- Answer questions about its content

What would you like to know?`),
        isHtml: true
      }]);
      
      toast({
        title: "Success",
        description: "PDF processed for chat context",
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant',
        content: "Sorry, I couldn't process this PDF. There might be an issue with the file or it's in a format I can't handle.",
      }]);
      
      toast({
        title: "Failed to process PDF",
        description: "Could not process the selected PDF.",
        variant: "destructive",
      });
    } finally {
      setProcessingPdf(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() || attachedFile) {
      // If there's an attached file, handle it first
      if (attachedFile) {
        // Add user message with file
        let messageContent = inputValue.trim() || `Uploaded: ${attachedFile.name}`;
        let messageObj: any = {
          role: "user",
          content: messageContent,
        };
        
        // Add file specific properties
        if (attachedFile.type.startsWith("image/")) {
          messageObj.image = attachedFilePreview;
        } else {
          messageObj.filename = attachedFile.name;
          messageObj.filetype = attachedFile.type;
        }
        
        setMessages(prev => [...prev, messageObj]);
        
        // Clear input and file attachment
        setInputValue('');
        setAttachedFile(null);
        setAttachedFilePreview(null);
        setAttachedFileType(null);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Process based on file type
          if (attachedFile.type.startsWith("image/")) {
            // Handle image file with Gemini Vision
            const analysis = await analyzeImageWithGemini(attachedFilePreview as string);
            
            // Add AI response
            setIsTyping(false);
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: formatAIResponse(analysis),
                isHtml: true
              }
            ]);
          } else if (attachedFile.type === "application/pdf") {
            // Handle PDF upload with the modified PDF processing function
            await processPdfFile(attachedFile);
            return; // Early return since processPdfFile handles its own messages
          } else if (
            attachedFile.type === "text/plain" || 
            attachedFile.type === "text/csv" ||
            attachedFile.type === "application/vnd.ms-excel" ||
            attachedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            attachedFile.type === "application/json"
          ) {
            // Handle text-based files
            const reader = new FileReader();
            reader.onload = async (e) => {
              const fileContent = e.target?.result as string;
              
              // Analyze file with Gemini
              const analysis = await analyzeFileWithGemini(
                fileContent,
                attachedFile.name,
                attachedFile.type
              );
              
              // Add AI response
              setIsTyping(false);
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: formatAIResponse(analysis),
                  isHtml: true
                }
              ]);
            };
            
            reader.onerror = () => {
              setIsTyping(false);
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: "Sorry, I couldn't read this file. It may be too large or in an unsupported format."
                }
              ]);
            };
            
            reader.readAsText(attachedFile);
          } else {
            // For other file types, send a generic response
            setIsTyping(false);
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: formatAIResponse(`I've received your file: ${attachedFile.name}. 
                
This appears to be a ${attachedFile.type || "unknown"} file. While I can't directly analyze the full contents of this file type, you can ask me questions about it, and I'll try to help based on the information you provide.

Would you like to:
1. Ask specific questions about this file?
2. Extract certain information from it? 
3. Compare it with the main document you uploaded?`),
                isHtml: true
              }
            ]);
          }
        } catch (error) {
          // Handle errors
          setIsTyping(false);
          console.error("File analysis error:", error);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: "Sorry, I encountered an error processing this file. Please try again or try a different file format."
            }
          ]);
          
          toast({
            title: "Analysis Error",
            description: "Failed to process the file.",
            variant: "destructive"
          });
        }
        
        return;
      }
      
      // If no file, handle as regular text message
      const userMessage = inputValue.trim();
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      // Clear input
      setInputValue('');
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Enhanced prompt to encourage complete sentences and page citations with emojis
        const response = await chatWithGeminiAboutPdf(
          `${userMessage} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to your response to make it more engaging.`,
          useAllPdfs
        );
        
        // Hide typing indicator and add AI response with enhanced formatting
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: formatAIResponse(response),
            isHtml: true 
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
            content: "Sorry, I encountered an error. Please try again." 
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
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Pass useAllPdfs parameter
      const response = await chatWithGeminiAboutPdf(
        `${question} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to make your response more engaging.`,
        useAllPdfs
      );
      
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: formatAIResponse(response),
          isHtml: true 
        }
      ]);
    } catch (error) {
      setIsTyping(false);
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I encountered an error. Please try again." 
        }
      ]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive"
      });
    }
  };

  // File attachment handler
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Process only the first file for simplicity
    setAttachedFile(file);
    setAttachedFileType(file.type);

    if (file.type.startsWith("image/")) {
      // Create preview for image
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setAttachedFilePreview(imageData);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, just set filename preview
      setAttachedFilePreview(null);
    }
  };

  // Clear file attachment
  const clearAttachment = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
    setAttachedFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full border-l">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt"
        style={{ display: "none" }}
        onChange={handleFilesUpload}
      />
      {/* Chat panel header with new toggle */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="font-medium text-sm">Research Assistant</h3>
          
          {/* Add the toggle switch here */}
          <div className="flex items-center space-x-2 ml-3 border-l pl-3">
            <span className="text-xs text-gray-500">Active PDF</span>
            <Switch
              checked={useAllPdfs}
              onCheckedChange={setUseAllPdfs}
              aria-label="Toggle between active PDF and all PDFs"
            />
            <span className="text-xs text-gray-500">All PDFs</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={toggleChat}
          title="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Chat messages area with enhanced styling */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="flex flex-col gap-4">
          {messages.map((message, i) => (
            <div key={i} className="group relative">
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
                {/* Display non-image file name and type */}
                {message.filename && !message.image && (
                  <div className="mb-2 text-xs text-muted-foreground">
                    <span className="font-semibold">{message.filename}</span> <span>({message.filetype})</span>
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
          ))}
          
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
      
      {/* File preview area */}
      {attachedFile && (
        <div className="p-2 border-t bg-gray-50">
          <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
            {attachedFilePreview ? (
              <img 
                src={attachedFilePreview} 
                alt="Preview" 
                className="h-12 w-12 object-cover rounded" 
              />
            ) : (
              <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded">
                <span className="text-xs font-semibold text-gray-500">
                  {attachedFileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFileType}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearAttachment}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Input area with file button next to input */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <div className="flex-1 flex border rounded-md overflow-hidden">
            <Textarea
              className="flex-1 min-h-10 max-h-32 resize-none border-0"
              placeholder="Ask about the document..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button 
              variant="ghost" 
              className="px-2 rounded-none border-l"
              onClick={handleAttachClick}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="shrink-0"
            size="icon"
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !attachedFile) || processingPdf}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
