
import { useState, useCallback } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

export function useChat(initialMessage?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);
  
  const sendMessage = useCallback((text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: messageText, isUser: true }]);
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: `I'm analyzing: "${messageText}"`, 
        isUser: false 
      }]);
      setIsLoading(false);
      setInput('');
    }, 1000);
    
    if (!text) {
      setInput('');
    }
  }, [input]);
  
  return {
    messages,
    input,
    handleInputChange,
    sendMessage,
    isLoading
  };
}
