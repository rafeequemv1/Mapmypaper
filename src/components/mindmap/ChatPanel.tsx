
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini } from "@/services/geminiService";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  explainImage?: string;
}

const ChatPanel = ({ toggleChat, explainText, explainImage }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [processingExplainImage, setProcessingExplainImage] = useState(false);
  
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
        const userMessage = `Explain this: "${explainText}"`;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Get response from Gemini
          const response = await chatWithGeminiAboutPdf(userMessage);
          
          // Hide typing indicator and add AI response
          setIsTyping(false);
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content: response }
          ]);
        } catch (error) {
          // Handle errors
          setIsTyping(false);
          console.error("Chat error:", error);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: "Sorry, I encountered an error explaining that text. Please try again." 
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

  // Process image to explain when it changes
  useEffect(() => {
    const processExplainImage = async () => {
      if (explainImage && !processingExplainImage) {
        setProcessingExplainImage(true);
        
        // Add user message with image indicator
        setMessages(prev => [...prev, { role: 'user', content: "Explain this selected area from the PDF" }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Get response from Gemini
          const response = await analyzeImageWithGemini(explainImage);
          
          // Hide typing indicator and add AI response
          setIsTyping(false);
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content: response }
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
            description: "Failed to analyze the image.",
            variant: "destructive"
          });
        } finally {
          setProcessingExplainImage(false);
        }
      }
    };
    
    processExplainImage();
  }, [explainImage, toast]);

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
        // Get response from Gemini
        const response = await chatWithGeminiAboutPdf(userMessage);
        
        // Hide typing indicator and add AI response
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: response }
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
    navigator.clipboard.writeText(text).then(() => {
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

  // Format message content with improved styling
  const formatMessageContent = (content: string) => {
    // Replace markdown headers with styled divs
    const formattedWithHeadings = content
      .replace(/^### (.*?)$/gm, '<h3 class="text-md font-bold mt-3 mb-1">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold mt-5 mb-3">$1</h1>');
    
    // Replace bullet points
    const formattedWithBullets = formattedWithHeadings
      .replace(/^- (.*?)$/gm, '<li class="ml-4 flex items-start"><span class="mr-2 mt-1">•</span><span>$1</span></li>')
      .replace(/^[*] (.*?)$/gm, '<li class="ml-4 flex items-start"><span class="mr-2 mt-1">•</span><span>$1</span></li>');
    
    // Convert line breaks to paragraph tags
    const paragraphs = formattedWithBullets
      .split('\n\n')
      .map(para => {
        if (
          para.startsWith('<h1') || 
          para.startsWith('<h2') || 
          para.startsWith('<h3') ||
          para.startsWith('<li')
        ) {
          return para;
        }
        if (para.trim() === '') return '';
        return `<p class="my-2">${para}</p>`;
      })
      .join('');
    
    return paragraphs;
  };

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Chat panel header */}
      <div className="flex items-center justify-between p-3 border-b bg-secondary/30">
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
      
      {/* Chat messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="flex flex-col gap-3">
          {messages.map((message, i) => (
            <div key={i} className="group relative">
              <div 
                className={`max-w-[95%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0" />
                    <div>{message.content}</div>
                  </div>
                ) : (
                  <div className="relative">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(message.content, i)}
                    >
                      {copiedMessageId === i ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="max-w-[95%] rounded-lg p-3 bg-muted">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-3 border-t">
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
