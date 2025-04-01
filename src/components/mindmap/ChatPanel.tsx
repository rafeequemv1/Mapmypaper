
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  selectedImage?: string | null;
  onScrollToPdfPosition?: (position: string) => void;
}

const ChatPanel = ({ toggleChat, explainText, selectedImage, onScrollToPdfPosition }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean; isImage?: boolean; imageUrl?: string }[]>([
    { role: 'assistant', content: 'Hello! 👋 I\'m your research assistant. Ask me questions about the document you uploaded. I can provide **citations** to help you find information in the document.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  
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
        
        // Add user message with the selected text
        setMessages(prev => [...prev, { role: 'user', content: `Please explain this text in detail with page citations: "${explainText}"` }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Enhanced prompt to encourage complete sentences and page citations
          const response = await chatWithGeminiAboutPdf(
            `Please explain this text in detail. Use complete sentences with relevant emojis and provide specific page citations in [citation:pageX] format: "${explainText}". Add emojis relevant to the content.`
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
              content: "Sorry, I encountered an error explaining that. Please try again." 
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
  }, [explainText, toast]);

  // Process selected image when it changes
  useEffect(() => {
    const processSelectedImage = async () => {
      if (selectedImage && !processingImage) {
        setProcessingImage(true);
        
        // Add user message with the image
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: 'Please analyze and explain this part of the document:',
          isImage: true,
          imageUrl: selectedImage
        }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Enhanced prompt to encourage detailed analysis of the image
          const response = await chatWithGeminiAboutPdf(
            `This is a screenshot from a research paper. Please analyze the content, explain what it shows in detail, and provide relevant context. Include specific page citations in [citation:pageX] format if you can determine the page. Add emojis relevant to the content to make your response engaging.`
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
              content: "Sorry, I encountered an error analyzing that image. Please try again." 
            }
          ]);
          
          toast({
            title: "Image Analysis Error",
            description: "Failed to analyze the selected area.",
            variant: "destructive"
          });
        } finally {
          setProcessingImage(false);
        }
      }
    };
    
    processSelectedImage();
  }, [selectedImage, toast]);

  // Activate citations in messages when they are rendered
  useEffect(() => {
    const messageContainers = document.querySelectorAll('.ai-message-content');
    
    messageContainers.forEach(container => {
      activateCitations(container as HTMLElement, (citation) => {
        console.log("Citation clicked:", citation);
        if (onScrollToPdfPosition) {
          onScrollToPdfPosition(citation);
        }
      });
    });
  }, [messages, onScrollToPdfPosition]);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      // Add user message
      const userMessage = inputValue.trim();
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      // Clear input
      setInputValue('');
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Enhanced prompt to encourage complete sentences and page citations with emojis
        const response = await chatWithGeminiAboutPdf(
          `${userMessage} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to your response to make it more engaging.`
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

  return (
    <div className="flex flex-col h-full border-l">
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
                {message.isImage && message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="Selected area from PDF" 
                      className="max-w-full rounded border border-gray-200"
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
      
      {/* Input area */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-10 max-h-32 resize-none"
            placeholder="Ask about the document..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
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
  );
};

export default ChatPanel;
