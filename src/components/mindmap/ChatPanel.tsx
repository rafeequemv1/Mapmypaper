
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini } from "@/services/geminiService";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
}

const ChatPanel = ({ toggleChat, explainText }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; imageData?: string; isProcessing?: boolean }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
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

  // Process text to explain when it changes
  useEffect(() => {
    const processExplainText = async () => {
      if (explainText && !processingExplainText) {
        setProcessingExplainText(true);
        
        // Check if this is an image snippet request
        if (explainText.includes('[IMAGE_SNIPPET]')) {
          const imageData = sessionStorage.getItem('selectedImageForChat');
          
          if (!imageData) {
            // Handle missing image data
            setMessages(prev => [
              ...prev, 
              { role: 'user', content: 'Please explain this PDF snippet I selected.' },
              { role: 'assistant', content: 'Sorry, I couldn\'t find the image data for the selected area.' }
            ]);
            setProcessingExplainText(false);
            return;
          }
          
          // CHANGED: Immediately add user message with the image
          // and add a placeholder assistant message that's "processing"
          setMessages(prev => [
            ...prev, 
            { 
              role: 'user', 
              content: 'Please explain this PDF snippet I selected.',
              imageData: imageData
            },
            {
              role: 'assistant',
              content: 'Analyzing the selected area...',
              isProcessing: true
            }
          ]);
          
          try {
            // Process image in the background
            analyzeImageWithGemini(imageData).then(response => {
              // Replace the processing message with the actual response
              setMessages(prev => {
                const newMessages = [...prev];
                // Find the processing message and replace it
                const processingIndex = newMessages.findIndex(m => m.isProcessing);
                if (processingIndex !== -1) {
                  newMessages[processingIndex] = { 
                    role: 'assistant', 
                    content: response
                  };
                }
                return newMessages;
              });
            }).catch(error => {
              // Handle errors by updating the processing message
              console.error("Image analysis error:", error);
              setMessages(prev => {
                const newMessages = [...prev];
                const processingIndex = newMessages.findIndex(m => m.isProcessing);
                if (processingIndex !== -1) {
                  newMessages[processingIndex] = { 
                    role: 'assistant', 
                    content: "Sorry, I encountered an error analyzing that image. Please try again."
                  };
                }
                return newMessages;
              });
              
              toast({
                title: "Analysis Error",
                description: "Failed to analyze the image snippet.",
                variant: "destructive"
              });
            });
          } catch (error) {
            // Handle immediate errors
            console.error("Image analysis setup error:", error);
            setMessages(prev => {
              const newMessages = [...prev];
              const processingIndex = newMessages.findIndex(m => m.isProcessing);
              if (processingIndex !== -1) {
                newMessages[processingIndex] = { 
                  role: 'assistant', 
                  content: "Sorry, I encountered an error analyzing that image. Please try again."
                };
              }
              return newMessages;
            });
          }
        } else {
          // Regular text explanation
          // Add user message with the selected text
          const userMessage = `Explain this: "${explainText}"`;
          setMessages(prev => [
            ...prev, 
            { role: 'user', content: userMessage },
            { role: 'assistant', content: 'Analyzing the selected text...', isProcessing: true }
          ]);
          
          try {
            // Process in the background
            chatWithGeminiAboutPdf(userMessage).then(response => {
              setMessages(prev => {
                const newMessages = [...prev];
                const processingIndex = newMessages.findIndex(m => m.isProcessing);
                if (processingIndex !== -1) {
                  newMessages[processingIndex] = { 
                    role: 'assistant', 
                    content: response
                  };
                }
                return newMessages;
              });
            }).catch(error => {
              console.error("Chat error:", error);
              setMessages(prev => {
                const newMessages = [...prev];
                const processingIndex = newMessages.findIndex(m => m.isProcessing);
                if (processingIndex !== -1) {
                  newMessages[processingIndex] = { 
                    role: 'assistant', 
                    content: "Sorry, I encountered an error explaining that text. Please try again."
                  };
                }
                return newMessages;
              });
              
              toast({
                title: "Explanation Error",
                description: "Failed to get an explanation from the AI.",
                variant: "destructive"
              });
            });
          } catch (error) {
            console.error("Chat setup error:", error);
            setMessages(prev => {
              const newMessages = [...prev];
              const processingIndex = newMessages.findIndex(m => m.isProcessing);
              if (processingIndex !== -1) {
                newMessages[processingIndex] = { 
                  role: 'assistant', 
                  content: "Sorry, I encountered an error explaining that text. Please try again."
                };
              }
              return newMessages;
            });
          }
        }
        
        // Reset processing flag
        setProcessingExplainText(false);
        
        // Clear the stored image data after processing
        sessionStorage.removeItem('selectedImageForChat');
      }
    };
    
    processExplainText();
  }, [explainText, toast]);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      // Add user message
      const userMessage = inputValue.trim();
      
      // CHANGED: Add placeholder message immediately
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: userMessage },
        { role: 'assistant', content: 'Thinking...', isProcessing: true }
      ]);
      
      // Clear input
      setInputValue('');
      
      try {
        // Get response from Gemini in the background
        chatWithGeminiAboutPdf(userMessage).then(response => {
          // Update the placeholder message with the actual response
          setMessages(prev => {
            const newMessages = [...prev];
            const processingIndex = newMessages.findIndex(m => m.isProcessing);
            if (processingIndex !== -1) {
              newMessages[processingIndex] = { 
                role: 'assistant', 
                content: response
              };
            }
            return newMessages;
          });
        }).catch(error => {
          console.error("Chat error:", error);
          setMessages(prev => {
            const newMessages = [...prev];
            const processingIndex = newMessages.findIndex(m => m.isProcessing);
            if (processingIndex !== -1) {
              newMessages[processingIndex] = { 
                role: 'assistant', 
                content: "Sorry, I encountered an error. Please try again."
              };
            }
            return newMessages;
          });
          
          toast({
            title: "Chat Error",
            description: "Failed to get a response from the AI.",
            variant: "destructive"
          });
        });
      } catch (error) {
        console.error("Chat setup error:", error);
        setMessages(prev => {
          const newMessages = [...prev];
          const processingIndex = newMessages.findIndex(m => m.isProcessing);
          if (processingIndex !== -1) {
            newMessages[processingIndex] = { 
              role: 'assistant', 
              content: "Sorry, I encountered an error. Please try again."
            };
          }
          return newMessages;
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

  // Custom renderer components for markdown
  const MarkdownContent = ({ content, isProcessing }: { content: string; isProcessing?: boolean }) => {
    // Show pulsing animation for processing messages
    if (isProcessing) {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-foreground/50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          {content}
        </div>
      );
    }
    
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold mt-3 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1.5">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
            h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
            p: ({ children }) => <p className="text-sm my-1.5">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 my-1.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5">{children}</ol>,
            li: ({ children }) => <li className="text-sm my-0.5">{children}</li>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-700 dark:text-gray-300 my-2">{children}</blockquote>,
            code: ({ children, className }) => {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded text-sm my-2 overflow-x-auto">
                  <code className={className}>{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>
              );
            },
            a: ({ children, href }) => <a href={href} className="text-blue-600 dark:text-blue-400 underline">{children}</a>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
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
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="flex flex-col gap-3">
          {messages.map((message, i) => (
            <div key={i} className="group relative">
              <div 
                className={`max-w-[90%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <>
                    <div className="text-sm">{message.content}</div>
                    {message.imageData && (
                      <div className="mt-2 max-w-[300px]">
                        <img 
                          src={message.imageData} 
                          alt="Selected PDF snippet" 
                          className="rounded-md border border-primary/30"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <MarkdownContent 
                    content={message.content} 
                    isProcessing={message.isProcessing}
                  />
                )}
                
                {message.role === 'assistant' && !message.isProcessing && (
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
