
import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Clipboard, Image, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chatWithGeminiAboutPdf, analyzeImageWithGemini, explainSelectedText } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { getPdfText } from "@/utils/pdfStorage";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  explainImage?: string | null;
  onExplainText?: (text: string) => void;
  onScrollToPdfPosition?: (position: string) => void;
  onPdfPlusClick?: () => void;
  activePdfKey?: string | null;
  allPdfKeys?: string[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  toggleChat,
  explainText = "",
  explainImage = null,
  onExplainText,
  onScrollToPdfPosition,
  onPdfPlusClick,
  activePdfKey,
  allPdfKeys = []
}) => {
  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [pdfText, setPdfText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialization message
  useEffect(() => {
    const initialMessage = {
      role: 'assistant' as const,
      content: `Hello! 👋 I'm your research assistant. Ask me questions about the document you uploaded. I can provide **citations** to help you find information in the document.\n\nFeel free to ask me any questions! Here are some suggestions:\n\n- What are the main topics covered in this paper?\n- Can you summarize the key findings?\n- What are the research methods used?\n- What are the limitations of this study?`
    };
    
    setChatHistory([initialMessage]);
  }, []);

  // Load PDF text when activePdfKey changes
  useEffect(() => {
    const loadPdfText = async () => {
      if (activePdfKey) {
        try {
          const text = await getPdfText(activePdfKey);
          if (text) {
            setPdfText(text);
            console.log("PDF text loaded for chat context:", text.substring(0, 100) + "...");
          } else {
            console.warn("No PDF text found for key:", activePdfKey);
          }
        } catch (error) {
          console.error("Error loading PDF text:", error);
        }
      }
    };
    
    loadPdfText();
  }, [activePdfKey]);

  // Process explainText changes
  useEffect(() => {
    if (explainText && explainText !== message) {
      setMessage(explainText);
      handleExplain(explainText);
    }
  }, [explainText]);

  // Process explainImage changes
  useEffect(() => {
    if (explainImage) {
      handleExplainImage(explainImage);
    }
  }, [explainImage]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleExplain = async (textToExplain: string) => {
    if (!textToExplain.trim()) return;
    
    // Add user message to chat history
    const userMessage = { role: 'user' as const, content: textToExplain };
    setChatHistory(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    try {
      // Use PDF text as context if available
      let contextPrompt = textToExplain;
      
      if (pdfText) {
        // Limit context length to avoid token limits
        const truncatedPdfText = pdfText.length > 10000 ? 
          pdfText.substring(0, 10000) + "..." : 
          pdfText;
          
        contextPrompt = `
          Context from the document:
          ---
          ${truncatedPdfText}
          ---
          
          Please answer this question using the context above:
          ${textToExplain}
          
          Include citations to specific sections or pages if possible.
        `;
      }
      
      // Call Gemini API to explain text
      let response;
      if (textToExplain.startsWith("## Summary of")) {
        // Handle node summary explanation differently
        response = await chatWithGeminiAboutPdf(textToExplain);
      } else {
        response = await explainSelectedText(contextPrompt);
      }
      
      // Format response with Markdown
      const formattedResponse = formatAIResponse(response);
      setAiResponse(formattedResponse);
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, { role: 'assistant', content: formattedResponse }]);
    } catch (error) {
      console.error("Error explaining text:", error);
      toast({
        title: "Error",
        description: "Failed to get an explanation. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't process that request. Please try again or check your internet connection." 
        }
      ]);
    } finally {
      setIsLoading(false);
      setMessage(""); // Clear the input field
    }
  };

  const handleExplainImage = async (imageData: string) => {
    if (!imageData) return;
    
    // Add user message with image to chat history
    const userMessage = { role: 'user' as const, content: "Please analyze this image from the document:" };
    setChatHistory(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    
    // Display image in chat
    setChatHistory(prev => [...prev, { 
      role: 'user' as const, 
      content: `<img src="${imageData}" alt="Selected area" style="max-width: 100%; border: 1px solid #e2e8f0; border-radius: 4px;" />`
    }]);
    
    try {
      // Call Gemini API to analyze image
      const response = await analyzeImageWithGemini(imageData);
      
      // Format response with Markdown
      const formattedResponse = formatAIResponse(response);
      setAiResponse(formattedResponse);
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, { role: 'assistant', content: formattedResponse }]);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Error",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't analyze that image. Please try again or select a different area." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    handleExplain(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyClick = (content: string) => {
    // Strip HTML tags for clean copy
    const textContent = content.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(textContent);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard.",
    });
  };

  // Function to handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleExplain(suggestion);
  };

  // Chat suggestions based on research papers
  const suggestions = [
    "What are the main topics covered in this paper?",
    "Can you summarize the key findings?",
    "What are the research methods used?",
    "What are the limitations of this study?"
  ];

  // Parse chat content for location markers
  const handleContentClick = (content: string) => {
    // Check for page references like "page 5" or "page5" or "p.5"
    const pageMatches = content.match(/page\s*(\d+)|p\.(\d+)/i);
    if (pageMatches && onScrollToPdfPosition) {
      const pageNum = pageMatches[1] || pageMatches[2];
      onScrollToPdfPosition(`page${pageNum}`);
    }
  };

  return (
    <div className="flex flex-col h-full border-l bg-white">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Assistant Chat</h2>
        <Button variant="ghost" size="icon" onClick={toggleChat}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex flex-col flex-1" onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            {allPdfKeys && allPdfKeys.length > 0 && (
              <TabsTrigger value="docs" className="flex-1">Documents</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
          {/* Chat Messages - Replace the div with ScrollArea component */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] p-3 rounded-lg ${
                      chat.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none"
                      onClick={() => handleContentClick(chat.content)}
                      dangerouslySetInnerHTML={{ __html: chat.content }}
                    />
                    
                    {chat.role === 'assistant' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 h-6 px-2"
                        onClick={() => handleCopyClick(chat.content)}
                      >
                        <Clipboard className="h-3 w-3 mr-1" />
                        <span className="text-xs">Copy</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-3 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestion pills (only show if chat is empty) */}
          {chatHistory.length <= 1 && (
            <div className="px-4 py-2 space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="mb-2 mr-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors block w-full text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* No PDF message */}
          {!activePdfKey && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    Please provide me with the paper you'd like me <Upload className="inline-block h-3 w-3" /> to summarize. I need the text of the paper to identify the main topics and provide page citations. <Image className="inline-block h-3 w-3" />
                  </p>
                  {onPdfPlusClick && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={onPdfPlusClick}
                    >
                      Upload PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me about the document..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px]"
                disabled={isLoading}
              />
              <Button 
                type="submit"
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="flex-1 overflow-auto m-0 p-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Available Documents</h3>
            {allPdfKeys && allPdfKeys.length > 0 ? (
              <ul className="space-y-2">
                {allPdfKeys.map((key, index) => {
                  const pdfMeta = sessionStorage.getItem(`pdfMeta_${key}`);
                  let name = `Document ${index + 1}`;
                  
                  if (pdfMeta) {
                    try {
                      const meta = JSON.parse(pdfMeta);
                      name = meta.name;
                    } catch (e) {
                      console.error("Error parsing PDF meta:", e);
                    }
                  }
                  
                  return (
                    <li 
                      key={key} 
                      className={`p-2 border rounded-md cursor-pointer ${key === activePdfKey ? 'bg-primary/10 border-primary/30' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm truncate">{name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm">No documents available</p>
                {onPdfPlusClick && (
                  <Button onClick={onPdfPlusClick} variant="outline" className="mt-4">
                    Upload PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatPanel;
