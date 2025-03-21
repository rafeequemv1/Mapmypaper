
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini } from "@/services/geminiService";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
}

const ChatPanel = ({ toggleChat, explainText }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; imageData?: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [currentMindmapId, setCurrentMindmapId] = useState<string | null>(null);
  
  // Load existing chat history if user is logged in and a mindmap exists
  useEffect(() => {
    const loadExistingChat = async () => {
      if (!user) return;
      
      try {
        const pdfFilename = sessionStorage.getItem('pdfFileName');
        const pdfData = sessionStorage.getItem('pdfData');
        
        if (!pdfFilename || !pdfData) return;
        
        // Check if this PDF is already stored in the database
        const { data: existingMindmaps, error } = await supabase
          .from('user_mindmaps')
          .select('id, chat_history, mindmap_data')
          .eq('user_id', user.id)
          .eq('pdf_filename', pdfFilename)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking for existing mindmap:', error);
          return;
        }
        
        // If this PDF already exists in database and has chat history
        if (existingMindmaps && existingMindmaps.chat_history) {
          console.log('Found existing chat history for this PDF');
          setCurrentMindmapId(existingMindmaps.id);
          
          // Load chat history
          const savedMessages = existingMindmaps.chat_history as Array<{ role: 'user' | 'assistant'; content: string; imageData?: string }>;
          if (Array.isArray(savedMessages) && savedMessages.length > 0) {
            setMessages(savedMessages);
          }
        } else {
          // This is a new PDF or it doesn't have chat history yet
          console.log('No existing chat history found. Creating new record.');
          if (existingMindmaps) {
            // PDF exists but no chat history
            setCurrentMindmapId(existingMindmaps.id);
          } else {
            // Create a new record for this PDF
            const { data: newMindmap, error: insertError } = await supabase
              .from('user_mindmaps')
              .insert({
                user_id: user.id,
                title: pdfFilename,
                pdf_filename: pdfFilename,
                pdf_data: pdfData,
                chat_history: messages,
              })
              .select('id')
              .single();
              
            if (insertError) {
              console.error('Error creating new mindmap record:', insertError);
              return;
            }
            
            if (newMindmap) {
              setCurrentMindmapId(newMindmap.id);
            }
          }
        }
      } catch (error) {
        console.error('Error in loadExistingChat:', error);
      }
    };
    
    loadExistingChat();
  }, [user]);

  // Save chat history to database when messages change
  useEffect(() => {
    const saveChatHistory = async () => {
      if (!user || !currentMindmapId || messages.length <= 1) return;
      
      try {
        const { error } = await supabase
          .from('user_mindmaps')
          .update({
            chat_history: messages,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentMindmapId);
          
        if (error) {
          console.error('Error saving chat history:', error);
        } else {
          console.log('Chat history saved successfully');
        }
      } catch (error) {
        console.error('Error in saveChatHistory:', error);
      }
    };
    
    saveChatHistory();
  }, [messages, user, currentMindmapId]);

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
        } else {
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
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm my-2 overflow-x-auto">
                  <code className={className}>{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>
              );
            },
            a: ({ children, href }) => <a href={href} className="text-black dark:text-white underline">{children}</a>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat panel header */}
      <div className="flex items-center justify-between p-3 border-b border-[#eaeaea] dark:border-[#333] bg-[#f9f9f9] dark:bg-[#191919]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-black dark:text-white" />
          <h3 className="font-medium text-sm text-black dark:text-white">Research Assistant</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#222]" 
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
                    ? 'bg-black text-white dark:bg-white dark:text-black ml-auto' 
                    : 'bg-gray-100 text-black dark:bg-[#222] dark:text-white'
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
                          className="rounded-md border border-white/30 dark:border-black/30"
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
                    className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]"
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
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-[#222]">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-black/50 dark:bg-white/50 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-black/50 dark:bg-white/50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-black/50 dark:bg-white/50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-3 border-t border-[#eaeaea] dark:border-[#333]">
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-10 max-h-32 resize-none bg-white border-[#eaeaea] text-black dark:bg-[#111] dark:border-[#333] dark:text-white"
            placeholder="Ask about the document..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            className="shrink-0 bg-black text-white dark:bg-white dark:text-black" 
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
