
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  onScrollToPdfPosition?: (position: string) => void;
  onExplainText?: (text: string) => void;
}

const ChatPanel = ({ toggleChat, explainText, onScrollToPdfPosition }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const exampleQuestions = [
    "Can you summarize the key findings?",
    "What methodology was used in this study?",
    "Explain the limitations of this research",
    "What are the practical implications?",
    "How does this compare to previous work?",
    "What future research is suggested?"
  ];
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isHtml?: boolean; }[]>([
    { 
      role: 'assistant', 
      content: "Hi there! 👋 I'm your research assistant for this paper. I've analyzed the document and I'm ready to help you understand it better. You can ask me about the methodology, findings, or any specific section you're curious about. Need a quick summary or want me to explain a complex concept? Just let me know!", 
      isHtml: true 
    }
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
        
        // Add user message with the selected text
        setMessages(prev => [...prev, { role: 'user', content: `Can you explain this text: "${explainText}"` }]);
        
        // Show typing indicator
        setIsTyping(true);
        
        try {
          // Enhanced conversational prompt
          const response = await chatWithGeminiAboutPdf(
            `I've selected this text from the paper and I'd like you to explain it in detail: "${explainText}". 
            Please explain this in a conversational, helpful way like an experienced researcher mentoring a student. 
            Use analogies where helpful, provide context about why this matters, and point out connections to other parts of the paper. 
            Include citations to specific sections or figures using [citation:pageX] format.
            End with a follow-up question to keep the conversation flowing naturally.`
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
              content: "I'm having trouble analyzing that section right now. Could you try selecting a different part or asking me about it in a different way?", 
              isHtml: true
            }
          ]);
          
          toast({
            title: "Explanation Error",
            description: "Failed to get an explanation from the AI.",
            variant: "destructive"
          });
        } finally {
          setProcessingExplainText(false);
        }
      }
    };
    
    processExplainText();
  }, [explainText, toast]);

  // Activate citations in messages when they are rendered
  useEffect(() => {
    // Use a longer timeout to ensure the DOM is fully rendered
    const activationTimeout = setTimeout(() => {
      const messageContainers = document.querySelectorAll('.ai-message-content');
      
      messageContainers.forEach(container => {
        activateCitations(container as HTMLElement, (citation) => {
          console.log("Desktop Citation clicked:", citation);
          if (onScrollToPdfPosition) {
            // Directly invoke the scroll function with sufficient delay to ensure proper handling
            onScrollToPdfPosition(citation);
          }
        });
      });
    }, 200); // Increased timeout for more reliable activation
    
    return () => clearTimeout(activationTimeout);
  }, [messages, onScrollToPdfPosition]);

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
          
          Remember you're having a conversation, not delivering a lecture. Be warm and supportive.`
        );
        
        // Hide typing indicator and add AI response with enhanced formatting
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
            content: "I'm having a bit of trouble processing that request. Could you try asking in a different way? Or perhaps you'd like to know something else about the paper?", 
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
  
  const handleExampleQuestionClick = (question: string) => {
    setInputValue(question);
    // Optional: Auto-send the question
    // setTimeout(() => handleSendMessage(), 100);
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
    <div className="flex flex-col h-full border-l">
      {/* Chat panel header */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
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
      
      {/* Chat messages area with enhanced styling */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Example questions */}
      {messages.length <= 3 && (
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
      
      {/* Input area */}
      <div className="p-3 border-t bg-white">
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
