
import { MessageSquare, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";

interface MobileChatSheetProps {
  onScrollToPdfPosition?: (position: string) => void;
  explainImage?: string;
}

const MobileChatSheet = ({ onScrollToPdfPosition, explainImage }: MobileChatSheetProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean; image?: string }[]>([
    { role: 'assistant', content: 'Hello! 👋 I\'m your research assistant. Ask me questions about the document you uploaded. I can provide **citations** to help you find information in the document.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainImage, setProcessingExplainImage] = useState(false);
  
  // Activate citations in messages when they are rendered
  useEffect(() => {
    if (isSheetOpen) {
      setTimeout(() => {
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
      }, 200); // Increased timeout to ensure DOM is fully ready
    }
  }, [messages, isSheetOpen, onScrollToPdfPosition]);
  
  // Process image to explain when it changes
  useEffect(() => {
    const processExplainImage = async () => {
      if (explainImage && !processingExplainImage && isSheetOpen) {
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
          const response = await chatWithGeminiAboutPdf(
            "Please explain the content visible in this image from the document. Describe what you see in detail. Include any relevant information, concepts, diagrams, or text visible in this selection."
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
          setProcessingExplainImage(false);
        }
      }
    };
    
    processExplainImage();
  }, [explainImage, isSheetOpen, toast]);
  
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
          `${userMessage} Respond with complete sentences and provide specific page citations in [citation:pageX] format where X is the page number. Add relevant emojis to make your response more engaging.`
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
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
        
        <ScrollArea className="flex-1 p-4">
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
                        style={{ maxHeight: '200px' }} 
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
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t mt-auto">
          <div className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border p-2 text-sm min-h-10 max-h-32 resize-none"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileChatSheet;
