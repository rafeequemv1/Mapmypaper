import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FilePlus, ArrowRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import MessageEmpty from "@/components/mindmap/MessageEmpty";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  explainImage?: string;
  onScrollToPdfPosition: (position: string) => void;
  onExplainText: (text: string) => void;
  activePdfKey: string | null;
  allPdfKeys: string[];
  onPdfPlusClick: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  toggleChat,
  explainText,
  explainImage,
  onScrollToPdfPosition,
  onExplainText,
  activePdfKey,
  allPdfKeys,
  onPdfPlusClick
}) => {
  const [messages, setMessages] = useState<
    { text: string; isUser: boolean; position?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Automatically send explainText as a message when it changes
  useEffect(() => {
    if (explainText) {
      handleSend(explainText);
    }
  }, [explainText]);

  // Automatically send explainImage as a message when it changes
  useEffect(() => {
    if (explainImage) {
      handleSend(`Analyze this image: ${explainImage}`);
    }
  }, [explainImage]);

  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const text = messageOverride || input;
      if (!text.trim()) return;

      // Add user message to chat
      setMessages((prev) => [...prev, { text, isUser: true }]);
      setInput("");

      setIsLoading(true);
      try {
        const response = await chatWithGeminiAboutPdf(text);
        // Extract position from response if present
        let position: string | undefined;
        const positionMatch = response.match(/\[position:([^\]]+)\]/);
        if (positionMatch) {
          position = positionMatch[1];
          onScrollToPdfPosition(position);
        }

        // Clean the response by removing the position tag
        const cleanResponse = response.replace(/\[position:[^\]]+\]/g, "").trim();

        // Add assistant message to chat
        setMessages((prev) => [...prev, { text: cleanResponse, isUser: false, position }]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, toast, onScrollToPdfPosition]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Research Assistant</h2>
        <Button variant="ghost" size="sm" onClick={toggleChat}>
          Close
        </Button>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-grow overflow-y-auto p-4"
        ref={chatContainerRef}
      >
        {allPdfKeys.length === 0 ? (
          <MessageEmpty onUploadClick={onPdfPlusClick} />
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${message.isUser
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
                  }`}
              >
                {message.text}
                {message.position && (
                  <Button
                    variant="link"
                    onClick={() => onScrollToPdfPosition(message.position!)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Context
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      {allPdfKeys.length > 0 && (
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading}>
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={onPdfPlusClick}>
              <FilePlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {/* Any content inside this div */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
