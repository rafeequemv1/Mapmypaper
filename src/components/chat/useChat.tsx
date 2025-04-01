
import { useState, useEffect } from 'react';

export interface ChatMessage {
  text: string;
  isUser: boolean;
}

export const useChat = (initialMessage?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      text: messageText,
      isUser: true
    }]);
    
    // Clear input if it's from the input field
    if (!text) setInput('');
    
    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: `I received your message: "${messageText}"`,
        isUser: false
      }]);
      setIsLoading(false);
    }, 1000);
  };

  return {
    messages,
    input,
    handleInputChange,
    sendMessage,
    isLoading
  };
};
