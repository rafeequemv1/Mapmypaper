
import React, { useState, useRef, useEffect } from "react";
import { sendPrompt } from "@/services/geminiService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatAiResponse } from "@/utils/formatAiResponse";
import { chatExampleQuestions } from "@/utils/chatExampleQuestions";
import { useQueryClient } from "@tanstack/react-query";

interface ChatPanelProps {
  explainText: string;
  onExplainText: (text: string) => void;
  onScrollToPdfPosition: (position: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  explainText,
  onExplainText,
  onScrollToPdfPosition
}) => {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot", content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showExamples, setShowExamples] = useState(true);

  // Scroll to bottom of chat when messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() && !explainText) return;
    
    // Use explainText if available, otherwise use the prompt from the textarea
    const promptToSend = explainText || prompt;
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { role: "user", content: promptToSend }]);
    
    // Reset inputs
    setPrompt("");
    onExplainText("");
    
    // Hide examples once user interacts
    setShowExamples(false);
    
    try {
      setIsLoading(true);
      
      // Get PDF text from session storage
      const pdfText = sessionStorage.getItem("pdfText");
      if (!pdfText) {
        throw new Error("PDF text not found. Please upload a PDF first.");
      }
      
      // Send prompt to AI service
      const response = await sendPrompt(promptToSend, pdfText);
      
      // Format the AI response
      const formattedResponse = formatAiResponse(response);
      
      // Add bot response to chat
      setChatHistory(prev => [...prev, { role: "bot", content: formattedResponse }]);
    } catch (error) {
      console.error("Error sending prompt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing your request",
        variant: "destructive",
      });
      
      // Add error message to chat
      setChatHistory(prev => [...prev, { 
        role: "bot", 
        content: "Sorry, I encountered an error while processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea height adjustment
  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle enter key to submit form (with shift+enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Extract PDF page references and make them clickable
  const processMessageWithPageLinks = (content: string) => {
    // Regular expression to match "page X" pattern
    const pageRegex = /page\s+(\d+)/gi;
    
    // Split the content by page references
    const parts = content.split(pageRegex);
    
    if (parts.length <= 1) return content;
    
    // Build the result with clickable links
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      
      // After each part (except the last one), add a page link
      if (i < parts.length - 1 && i % 2 === 0) {
        const pageNum = parts[i + 1];
        result.push(
          <button
            key={`page-${i}-${pageNum}`}
            onClick={() => onScrollToPdfPosition(`page${pageNum}`)}
            className="text-blue-600 hover:underline font-medium"
          >
            page {pageNum}
          </button>
        );
        // Skip the page number part since we've handled it
        i++;
      }
    }
    
    return result;
  };
  
  // Handle clicking an example question
  const handleExampleClick = (question: string) => {
    setPrompt(question);
    if (textareaRef.current) {
      textareaRef.current.focus();
      handleTextareaInput();
    }
  };

  // Effect to handle explainText changes
  useEffect(() => {
    if (explainText && !isLoading) {
      // When text is selected from PDF, replace the current prompt
      setPrompt(`Explain this: "${explainText}"`);
      handleTextareaInput();
    }
  }, [explainText, isLoading]);

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-3 border-b bg-white flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Chat</h2>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-1">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ scrollBehavior: "smooth" }}>
        {chatHistory.length === 0 && showExamples && (
          <div className="space-y-4 mt-2">
            <p className="text-gray-600 text-sm">Ask questions about your PDF:</p>
            
            <div className="grid gap-2">
              {chatExampleQuestions.map((question, index) => (
                <button
                  key={index}
                  className="text-left p-2 bg-white border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => handleExampleClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {chatHistory.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${message.role === "user" ? "ml-6" : "mr-6"}`}
          >
            <div 
              className={`p-3 rounded-xl ${
                message.role === "user" 
                  ? "bg-blue-500 text-white ml-auto rounded-tr-none" 
                  : "bg-white border rounded-tl-none"
              }`}
              style={{ maxWidth: "85%" }}
            >
              {message.role === "user" 
                ? message.content 
                : processMessageWithPageLinks(message.content)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="mb-4 mr-6">
            <div className="p-3 rounded-xl bg-white border rounded-tl-none inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[40px] max-h-[120px] py-2"
            placeholder="Ask a question about your PDF..."
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading || (!prompt.trim() && !explainText)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
