
import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/gemini";
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";

interface ChatPanelProps {
  toggleChat: () => void;
  initialMessages?: { role: 'user' | 'assistant'; content: string }[];
  onMessagesChange?: (messages: { role: 'user' | 'assistant'; content: string }[]) => void;
}

const ChatPanel = ({ 
  toggleChat, 
  initialMessages,
  onMessagesChange
}: ChatPanelProps) => {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(
    initialMessages || [
      { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
    ]
  );
  const [isTyping, setIsTyping] = useState(false);
  
  // Update messages when initialMessages changes
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      // Get the last message to check if it's a new text selection
      const lastMessage = initialMessages[initialMessages.length - 1];
      
      // If the last message contains "Explain this text" and it's from the user
      if (lastMessage.role === 'user' && lastMessage.content.startsWith('Explain this text:')) {
        setMessages(initialMessages);
        
        // Automatically process this request
        handleTextExplanationRequest(lastMessage.content);
      } else {
        setMessages(initialMessages);
      }
    }
  }, [initialMessages]);
  
  // Notify parent component about message changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);
  
  // Handle text explanation requests automatically
  const handleTextExplanationRequest = async (userMessage: string) => {
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
          content: "Sorry, I encountered an error processing your selection. Please try again." 
        }
      ]);
      
      toast({
        title: "Processing Error",
        description: "Failed to explain the selected text.",
        variant: "destructive"
      });
    }
  };
  
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
