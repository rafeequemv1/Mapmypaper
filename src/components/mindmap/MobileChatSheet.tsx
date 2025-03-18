
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";

const MobileChatSheet = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
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
            <h3 className="font-medium text-sm">Chat Assistant</h3>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <div 
                key={i} 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            ))}
            
            {isTyping && (
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
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
