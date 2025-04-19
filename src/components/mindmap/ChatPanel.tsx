import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateMindMapChatResponse } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateUniqueId } from "@/lib/utils";
import { trackMindMapChatInteraction } from "@/utils/analytics";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText: string;
  onExplainText: (text: string) => void;
}

const ChatPanel = ({ toggleChat, explainText, onExplainText }: ChatPanelProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCloseChat = () => {
    toggleChat();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newMessage = {
      id: generateUniqueId(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateMindMapChatResponse(inputMessage);
      
      const aiMessage = {
        id: generateUniqueId(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      trackMindMapChatInteraction('user_message');
    } catch (error) {
      console.error('Error generating chat response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, toast]);

  useEffect(() => {
    if (explainText) {
      const newMessage = {
        id: generateUniqueId(),
        text: `Explain this text: "${explainText}"`,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      
      const explainTextMessage = async () => {
        setIsLoading(true);
        try {
          const aiResponse = await generateMindMapChatResponse(
            `Provide a detailed explanation for this text: "${explainText}"`
          );
          
          const aiMessage = {
            id: generateUniqueId(),
            text: aiResponse,
            sender: 'ai',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error('Error generating text explanation:', error);
        } finally {
          setIsLoading(false);
        }
      };

      explainTextMessage();
    }
  }, [explainText]);

  return (
    <div className="flex flex-col h-full bg-gray-100 border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Chat</h2>
        <Button variant="ghost" size="icon" onClick={handleCloseChat}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col rounded-lg p-3 w-fit max-w-[80%] ${
                message.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              <span className="text-xs text-gray-500 self-end">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p className="text-sm text-gray-500">Generating response...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none border rounded-md py-2 px-3 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <Button onClick={handleSendMessage} disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
