
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
  
  // Track the last processed requests by storing their timestamp and content hash
  const processedRequestsRef = useRef<{timestamp: number, contentHash: string}[]>([]);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; imageData?: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  
  // Helper function to generate a simple hash for content tracking
  const generateContentHash = (content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  };
  
  // Helper function to check if a request was recently processed
  const wasRecentlyProcessed = (content: string): boolean => {
    const contentHash = generateContentHash(content);
    const now = Date.now();
    
    // Remove old processed requests (older than 5 seconds)
    processedRequestsRef.current = processedRequestsRef.current.filter(
      req => now - req.timestamp < 5000
    );
    
    // Check if this content was recently processed
    return processedRequestsRef.current.some(req => req.contentHash === contentHash);
  };
  
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
        // Check if this exact request was processed recently to avoid duplicates
        if (wasRecentlyProcessed(explainText)) {
          console.log("Duplicate request detected, ignoring:", explainText.substring(0, 50));
          return;
        }
        
        setProcessingExplainText(true);
        
        // Add this request to the processed list
        const contentHash = generateContentHash(explainText);
        processedRequestsRef.current.push({
          timestamp: Date.now(),
          contentHash
        });
        
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
          
          // Add user message with the image
          setMessages(prev => [
            ...prev, 
            { 
              role: 'user', 
              content: 'Please explain this PDF snippet I selected.',
              imageData: imageData
            }
          ]);
          
          // Show typing indicator
          setIsTyping(true);
          
          try {
            // Get response from Gemini vision
            const response = await analyzeImageWithGemini(imageData);
            
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
              title: "Analysis Error",
              description: "Failed to analyze the image snippet.",
              variant: "destructive"
            });
          }
        } 
        // Check if this is a node expansion request
        else if (explainText.includes('[EXPAND_NODE_')) {
          // Extract the node topic from the request
          const nodeTopic = explainText.split('Please expand on this mind map node: "')[1]?.split('"')[0] || '';
          
          // Add user message
          setMessages(prev => [
            ...prev, 
            { role: 'user', content: `Please suggest subtopics for this mind map node: "${nodeTopic}"` }
          ]);
          
          // Show typing indicator
          setIsTyping(true);
          
          try {
            // Get response from Gemini
            const response = await chatWithGeminiAboutPdf(
              `Generate 3-5 brief subtopics for a mind map node titled "${nodeTopic}". 
               Format as a bulleted list with short phrases (2-4 words each).`
            );
            
            // Hide typing indicator and add AI response
            setIsTyping(false);
            setMessages(prev => [
              ...prev, 
              { role: 'assistant', content: response }
            ]);
          } catch (error) {
            // Handle errors
            setIsTyping(false);
            console.error("Node expansion error:", error);
            setMessages(prev => [
              ...prev, 
              { 
                role: 'assistant', 
                content: "Sorry, I encountered an error expanding that node. Please try again." 
              }
            ]);
            
            toast({
              title: "Expansion Error",
              description: "Failed to get node expansion suggestions.",
              variant: "destructive"
            });
          }
        }
        else {
          // Regular text explanation
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
          }
        }
        
        // Reset processing flag
        setProcessingExplainText(false);
      }
    };
    
    processExplainText();
    
    // Return a cleanup function that runs when component unmounts or explainText changes
    return () => {
      // Note: We intentionally do NOT clear the image data here anymore
      // This allows multiple capture requests to work correctly
    };
  }, [explainText, toast]);

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
  const MarkdownContent = ({ content }: { content: string }) => {
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
                  <MarkdownContent content={message.content} />
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
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
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
