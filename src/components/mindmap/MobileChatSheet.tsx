
import { MessageSquare, Copy, Check, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";

interface MobileChatSheetProps {
  onScrollToPdfPosition?: (position: string) => void;
}

const MobileChatSheet = ({ onScrollToPdfPosition }: MobileChatSheetProps) => {
  const { toast } = useToast();
  const exampleQuestions = [
    "Summarize the key findings",
    "What methodology was used?",
    "Explain the limitations",
    "Practical implications?",
    "How does this compare to previous work?",
  ];
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean }[]>([
    { 
      role: 'assistant', 
      content: "Hi there! 👋 I'm your research assistant for this paper. I've analyzed the document and I'm ready to help you understand it better. What would you like to know about this research?",
      isHtml: true
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  
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
        // Enhanced conversational prompt
        const response = await chatWithGeminiAboutPdf(
          `${userMessage}
          
          Please respond in a conversational, helpful manner like an experienced researcher mentoring a student.
          Use your knowledge of the paper to give a thorough but accessible explanation.
          
          Structure your response with clear headings and bullet points when appropriate.
          Include specific citations to the paper using [citation:pageX] format when referencing content.
          Use analogies or examples to clarify complex concepts when appropriate.
          Include relevant emojis to make your response engaging but don't overdo it.
          End your response with a natural follow-up question related to what we're discussing.
          
          Since this is on mobile, keep your response relatively concise but still informative.
          Remember you're having a conversation, not delivering a lecture. Be warm and supportive.`
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
        // Handle errors with a more conversational response
        setIsTyping(false);
        console.error("Chat error:", error);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "I'm having a bit of trouble with that question. Could you try asking in a different way? Or perhaps you'd like to know something else about the paper?", 
            isHtml: true
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
  
  const handleExampleQuestionClick = (question: string) => {
    setInputValue(question);
    // Optional: Auto-send the question
    // setTimeout(() => handleSendMessage(), 100);
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
        
        {/* Example questions */}
        {messages.length <= 2 && (
          <div className="px-3 py-2 border-t bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-100 transition-colors flex items-center gap-1"
                  onClick={() => handleExampleQuestionClick(question)}
                >
                  {question}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-3 border-t mt-auto">
          <div className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border p-2 text-sm min-h-10 max-h-32 resize-none"
              placeholder="Ask about the document..."
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
