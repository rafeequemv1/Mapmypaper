
import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/gemini";
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";

interface ChatPanelProps {
  toggleChat: () => void;
}

const ChatPanel = ({ toggleChat }: ChatPanelProps) => {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const handleSendMessage = async (userMessage: string) => {
    // Add user message
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
      
      // Store chat history in Supabase if needed in the future
      // Currently not implemented as we need to set up authentication first
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
  };

  return (
    <div className="flex flex-col h-full border-l">
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
      <ChatMessageList messages={messages} isTyping={isTyping} />
      
      {/* Input area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatPanel;
