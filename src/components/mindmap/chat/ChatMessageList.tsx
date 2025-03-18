
import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

interface ChatMessageListProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  isTyping: boolean;
}

const ChatMessageList = ({ messages, isTyping }: ChatMessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="flex flex-col gap-3">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} index={i} />
        ))}
        
        {isTyping && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
