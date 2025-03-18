
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: { role: 'user' | 'assistant'; content: string };
  index: number;
}

const ChatMessage = ({ message, index }: ChatMessageProps) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied",
        duration: 2000,
      });
      
      // Reset the copied icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
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
    <div className="group relative">
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}
      >
        {message.content}
        
        {message.role === 'assistant' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(message.content)}
          >
            {isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
