
import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Copy, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  onScrollToPdfPosition?: (position: string) => void;
  onExplainText?: (text: string) => void;
}

const ChatPanel = ({ toggleChat, explainText, onScrollToPdfPosition, onExplainText }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean; }[]>([
    { role: 'assistant', content: 'Hello! 👋 I\'m your research assistant. Ask me questions about the document you uploaded. I can provide **citations** to help you find information in the document.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Enhanced text explanation processing with visual feedback
  const processExplainText = useCallback(async (text: string) => {
    if (!text || processingExplainText) return;
    
    setProcessingExplainText(true);
    
    // Visual feedback that text is being processed
    const highlightedText = text.length > 100 ? text.substring(0, 100) + "..." : text;
    
    // Add user message with the selected text and visual styling
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: `<div class="selected-text-highlight">
          <div class="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4" />
            <span class="font-semibold">Selected text for explanation:</span>
          </div>
          "${highlightedText}"
        </div>`,
        isHtml: true 
      }
    ]);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Enhanced prompt to encourage comprehensive explanation with page citations
      const response = await chatWithGeminiAboutPdf(
        `Please provide a detailed explanation of this text, covering the why, how, and what aspects. Use complete sentences with relevant emojis and provide specific page citations in [citation:pageX] format: "${text}". Structure your response to address key concepts, methodology, and implications.`
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
      // Handle errors with more user-friendly message
      setIsTyping(false);
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I encountered an error explaining that text. It might be too complex or contain formatting that's difficult to process. Please try selecting a different portion of text or rephrase your question.",
          isHtml: false
        }
      ]);
      
      toast({
        title: "Explanation Error",
        description: "Failed to get an explanation from the AI. Please try again with a different selection.",
        variant: "destructive"
      });
    } finally {
      setProcessingExplainText(false);
    }
  }, [toast]);
  
  // Process text to explain when it changes
  useEffect(() => {
    if (explainText && !processingExplainText) {
      processExplainText(explainText);
    }
  }, [explainText, processExplainText]);

  // Activate citations in messages when they are rendered with improved styling
  useEffect(() => {
    // Use a longer timeout to ensure the DOM is fully rendered
    const activationTimeout = setTimeout(() => {
      const messageContainers = document.querySelectorAll('.ai-message-content');
      
      messageContainers.forEach(container => {
        activateCitations(container as HTMLElement, (citation) => {
          console.log("Desktop Citation clicked:", citation);
          if (onScrollToPdfPosition) {
            // Directly invoke the scroll function with visual feedback
            const citationEl = container.querySelector('.citation-link');
            if (citationEl) {
              citationEl.classList.add('citation-active');
              setTimeout(() => {
                citationEl.classList.remove('citation-active');
              }, 1000);
            }
            
            // Show toast notification
            toast({
              title: "Navigating to citation",
              description: `Scrolling to ${citation}`,
              duration: 1500,
            });
            
            onScrollToPdfPosition(citation);
          }
        });
      });
      
      // Add styling for citations and selected text
      const style = document.createElement('style');
      style.innerHTML = `
        .citation-link {
          color: #2563EB;
          background-color: rgba(37, 99, 235, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .citation-link:hover {
          background-color: rgba(37, 99, 235, 0.2);
          transform: translateY(-1px);
        }
        
        .citation-active {
          background-color: rgba(37, 99, 235, 0.3);
          transform: scale(1.05);
        }
        
        .selected-text-highlight {
          background-color: rgba(37, 99, 235, 0.05);
          border-left: 3px solid #2563EB;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 4px;
          font-style: italic;
        }
      `;
      
      if (!document.head.querySelector('#citation-styles')) {
        style.id = 'citation-styles';
        document.head.appendChild(style);
      }
    }, 300); // Increased timeout for more reliable activation
    
    return () => clearTimeout(activationTimeout);
  }, [messages, onScrollToPdfPosition, toast]);

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
        // Enhanced prompt to encourage complete sentences, page citations, and emojis
        const response = await chatWithGeminiAboutPdf(
          `${userMessage} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to make your response more engaging. Consider the why, how, and what aspects in your explanation when appropriate.`
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
            content: "Sorry, I encountered an error. Please try again with a different question.",
            isHtml: false
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
