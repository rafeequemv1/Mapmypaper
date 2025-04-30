
import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, Image, Paperclip, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import ChatToolbar from "./ChatToolbar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAllPdfs } from "@/components/PdfTabs";

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

const ChatPanel = ({
  toggleChat,
  explainText,
  explainImage,
  onScrollToPdfPosition,
  onExplainText,
  onPdfPlusClick,
  activePdfKey,
  allPdfKeys,
}: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'assistant' | 'system'; 
    content: string; 
    isHtml?: boolean; 
    image?: string; 
    pdfKey?: string | null;
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

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      // Add user message
      const userMessage = inputValue.trim();
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: userMessage,
        pdfKey: activePdfKey
      }]);
      
      // Clear input
      setInputValue('');
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Build the prompt with context
        let prompt = `${userMessage} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to your response to make it more engaging.`;
        
        // If using all papers, add that context to the prompt
        if (useAllPapers && allPdfKeys.length > 1) {
          prompt = `Consider all uploaded documents when answering. ${prompt}`;
        }
        
        // Call the API with the prompt
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
    <div className="flex flex-col h-full border-l">
      {/* File input for attachments (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle file attachment here
          if (e.target.files && e.target.files[0]) {
            toast({
              title: "File attached",
              description: `${e.target.files[0].name} added to your message`,
            });
          }
        }}
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
      
      {/* Chat Toolbar with plus and attach */}
      <ChatToolbar 
        onPlus={onPdfPlusClick}
        onAttach={handleAttachClick}
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
      
      {/* Input area */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-10 max-h-32 resize-none"
            placeholder={`Ask about ${useAllPapers ? 'all documents' : 'the document'}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAttachClick}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              className="shrink-0" 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
