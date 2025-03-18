import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
};

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. Ask me anything about the mind map or the document.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Add a placeholder typing message
      const typingMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      };
      
      setMessages(prev => [...prev, typingMessage]);

      // Use the Gemini API service to get a response
      const pdfText = sessionStorage.getItem("pdfText") || "";
      const userQuery = input.trim();
      
      // Get the response
      const response = await generateChatResponse(userQuery, pdfText);
      
      // Remove the typing message and add the real response with typing animation
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }];
      });
    } catch (error) {
      console.error("Error getting response:", error);
      // Remove typing indicator if there's an error
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple function to generate a response using the existing Gemini service
  const generateChatResponse = async (query: string, context: string): Promise<string> => {
    try {
      // In a real implementation, you'd create a dedicated endpoint for chat
      // But for now, we'll modify our call to the existing function
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful research assistant. Answer the following question based on the document context.
                         
                         Document context (partial): ${context.slice(0, 5000)}
                         
                         User question: ${query}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error("Unexpected API response format:", data);
        return "I'm sorry, I couldn't generate a response right now.";
      }
    } catch (error) {
      console.error("Error generating chat response:", error);
      return "Sorry, there was an error processing your request.";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message content with basic markdown-like formatting
  const formatMessageContent = (content: string) => {
    // Handle code blocks with ```
    content = content.replace(
      /```(.*?)\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>'
    );
    
    // Handle inline code with `
    content = content.replace(
      /`([^`]+)`/g, 
      '<code class="bg-muted px-1 rounded text-sm font-mono">$1</code>'
    );
    
    // Handle bold with ** or __
    content = content.replace(
      /(\*\*|__)(.*?)\1/g,
      '<strong>$2</strong>'
    );
    
    // Handle italic with * or _
    content = content.replace(
      /(\*|_)(.*?)\1/g,
      '<em>$2</em>'
    );
    
    // Handle line breaks
    content = content.replace(/\n/g, '<br/>');
    
    return content;
  };

  // Renders a typing animation
  const TypeAnimation = () => (
    <div className="flex space-x-1 items-center py-2 px-1">
      <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-75" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-150" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Message area - takes all available space but allows scrolling */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0">
          <div className="p-4 space-y-4">
            {messages.map((message, index) => {
              // Check if this message is part of a sequence from the same sender
              const isSequence = index > 0 && messages[index - 1].role === message.role;
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3 items-start",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Only show avatar for first message in a sequence */}
                  {message.role === "assistant" && !isSequence && (
                    <Avatar className="h-8 w-8 bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none",
                      // Add margin-left for user messages in a sequence
                      message.role === "user" && isSequence ? "ml-12" : "",
                      // Add margin-right for assistant messages in a sequence  
                      message.role === "assistant" && isSequence ? "ml-12" : ""
                    )}
                  >
                    {message.isTyping ? (
                      <TypeAnimation />
                    ) : (
                      <>
                        <div 
                          className="whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                        />
                        <div className="text-xs opacity-70 mt-1.5 text-right">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Only show avatar for first message in a sequence */}
                  {message.role === "user" && !isSequence && (
                    <Avatar className="h-8 w-8 bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Fixed input area at bottom */}
      <div className="flex-shrink-0 border-t bg-background p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            className="h-auto"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
