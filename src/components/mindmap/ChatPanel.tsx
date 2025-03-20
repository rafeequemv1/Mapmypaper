import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Copy, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatWithGeminiAboutPdf } from "@/services/geminiService";
import { supabase } from "@/integrations/supabase/client";
import { MindElixirInstance } from "mind-elixir";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatPanelProps {
  toggleChat: () => void;
  explainText?: string;
  mindMap?: MindElixirInstance | null;
}

const ChatPanel = ({ toggleChat, explainText, mindMap }: ChatPanelProps) => {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document or use commands to modify the mind map.' },
    { role: 'system', content: 'Type /help to see available commands for mind map manipulation.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [processingExplainText, setProcessingExplainText] = useState(false);
  const [showCommandHelp, setShowCommandHelp] = useState(false);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const processExplainText = async () => {
      if (explainText && !processingExplainText) {
        setProcessingExplainText(true);
        
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
        } finally {
          setProcessingExplainText(false);
        }
      }
    };
    
    processExplainText();
  }, [explainText, toast]);

  const handleMindMapCommand = (command: string, content: string): boolean => {
    if (!mindMap) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Mind map is not available yet. Wait for it to load and try again.' 
      }]);
      return true;
    }

    // Parse the command and content
    try {
      // Commands structure:
      // /add [parent-id] [topic] - Add new node to specified parent
      // /edit [node-id] [new-topic] - Edit node's topic
      // /delete [node-id] - Delete node
      // /move [node-id] - Move node to new parent
      // /help - Show available commands
      
      if (command === '/help') {
        setShowCommandHelp(true);
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Available commands:
- /add [parent-id] [topic] - Add new node to specified parent
- /edit [node-id] [new-topic] - Edit node's topic
- /delete [node-id] - Delete node
- /move [node-id] [new-parent-id] - Move node to new parent
- /show - Show node IDs in the mind map
- /save - Save current mind map to localStorage
- /load - Load mind map from localStorage
- /data - Show the mind map data as JSON
- /help - Show this help` 
        }]);
        return true;
      }
      
      if (command === '/show') {
        // Toggle showing node IDs
        const nodes = mindMap.container.querySelectorAll('.node');
        nodes.forEach((node) => {
          const nodeId = node.getAttribute('data-nodeid');
          const idElement = document.createElement('div');
          idElement.className = 'node-id-label';
          idElement.textContent = nodeId;
          idElement.style.position = 'absolute';
          idElement.style.bottom = '-15px';
          idElement.style.left = '0';
          idElement.style.fontSize = '10px';
          idElement.style.color = '#666';
          
          // Remove existing ID labels first
          const existingLabel = node.querySelector('.node-id-label');
          if (existingLabel) {
            node.removeChild(existingLabel);
          } else {
            node.appendChild(idElement);
          }
        });
        
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: 'Toggled node IDs visibility in the mind map.'
        }]);
        return true;
      }
      
      if (command === '/data') {
        // Show the mind map data
        const data = mindMap.getData();
        const jsonString = JSON.stringify(data, null, 2);
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Current mind map data:\n\`\`\`json\n${jsonString}\n\`\`\``
        }]);
        return true;
      }
      
      if (command === '/save') {
        // Save the mind map data to localStorage
        const data = mindMap.getData();
        try {
          sessionStorage.setItem('mindMapData', JSON.stringify(data));
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Mind map saved successfully!'
          }]);
        } catch (error) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Error saving mind map: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
        return true;
      }
      
      if (command === '/load') {
        // Load mind map from localStorage
        try {
          const savedData = sessionStorage.getItem('mindMapData');
          if (!savedData) {
            setMessages(prev => [...prev, { 
              role: 'system', 
              content: 'No saved mind map data found.'
            }]);
            return true;
          }
          
          const data = JSON.parse(savedData);
          // Fix: Use init() with the data instead of the non-existent initWithData method
          mindMap.init(data);
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Mind map loaded successfully!'
          }]);
        } catch (error) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Error loading mind map: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
        return true;
      }
      
      if (command === '/add') {
        // Parse parent ID and topic
        const match = content.match(/(\S+)\s+(.+)/);
        if (!match) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Invalid format. Use /add [parent-id] [topic]'
          }]);
          return true;
        }
        
        const [, parentId, topic] = match;
        
        // Find the parent node
        const parent = mindMap.nodeData[parentId];
        if (!parent) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Parent node with ID "${parentId}" not found.`
          }]);
          return true;
        }
        
        // Generate a unique ID for the new node
        const newNodeId = `node_${Date.now()}`;
        
        // Fix: Create a proper node object for addChild instead of passing a string
        // MindElixir.addChild expects (parent, topic, id?)
        const newTopic = topic;
        
        // Create a new node with the topic
        try {
          mindMap.addChild(parent, newTopic);
          
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Added new node "${topic}" to parent "${parentId}".`
          }]);
        } catch (error) {
          console.error("Error adding node:", error);
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Error adding node: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
        
        return true;
      }
      
      if (command === '/edit') {
        // Parse node ID and new topic
        const match = content.match(/(\S+)\s+(.+)/);
        if (!match) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Invalid format. Use /edit [node-id] [new-topic]'
          }]);
          return true;
        }
        
        const [, nodeId, newTopic] = match;
        
        // Find the node
        const node = mindMap.nodeData[nodeId];
        if (!node) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Node with ID "${nodeId}" not found.`
          }]);
          return true;
        }
        
        // Fix: Use the correct method to update node topic
        // MindElixir doesn't have updateNodeTopic, but can update topic directly
        if (node.topic) {
          node.topic = newTopic;
          mindMap.refresh(); // Refresh to update the view
        }
        
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Updated node "${nodeId}" topic to "${newTopic}".`
        }]);
        return true;
      }
      
      if (command === '/delete') {
        // Parse node ID
        const nodeId = content.trim();
        if (!nodeId) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Invalid format. Use /delete [node-id]'
          }]);
          return true;
        }
        
        // Find the node
        const node = mindMap.nodeData[nodeId];
        if (!node) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Node with ID "${nodeId}" not found.`
          }]);
          return true;
        }
        
        // Remove the node
        mindMap.removeNode(node);
        
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Deleted node "${nodeId}".`
        }]);
        return true;
      }
      
      if (command === '/move') {
        // Parse node ID and new parent ID
        const match = content.match(/(\S+)\s+(\S+)/);
        if (!match) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: 'Invalid format. Use /move [node-id] [new-parent-id]'
          }]);
          return true;
        }
        
        const [, nodeId, newParentId] = match;
        
        // Find the node and new parent
        const node = mindMap.nodeData[nodeId];
        const newParent = mindMap.nodeData[newParentId];
        
        if (!node) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Node with ID "${nodeId}" not found.`
          }]);
          return true;
        }
        
        if (!newParent) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `New parent node with ID "${newParentId}" not found.`
          }]);
          return true;
        }
        
        // Move the node to the new parent
        try {
          // First remove the node from its current parent
          const currentParent = node.parent;
          if (currentParent) {
            mindMap.removeNode(node);
          }
          
          // Fix: Create a proper node with the original topic
          const originalTopic = node.topic || "New Node";
          
          // Use addChild with correct parameter order (parent, topic)
          mindMap.addChild(newParent, originalTopic);
          
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Moved node "${nodeId}" to parent "${newParentId}".`
          }]);
        } catch (error) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `Error moving node: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]);
        }
        return true;
      }
      
      // If we reach here, it's not a valid command
      return false;
    } catch (error) {
      console.error("Error processing mind map command:", error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      return true;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      // Check if it's a command
      if (inputValue.startsWith('/')) {
        // Add user message
        const userMessage = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        
        // Clear input
        setInputValue('');
        
        // Parse command
        const [command, ...contentParts] = userMessage.split(' ');
        const content = contentParts.join(' ');
        
        // Process command
        if (handleMindMapCommand(command, content)) {
          return; // Command was processed
        }
        
        // If we reach here, it wasn't a valid command
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Unknown command "${command}". Type /help to see available commands.`
        }]);
        return;
      }
      
      // Handle regular chat message
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

  return (
    <div className="flex flex-col h-full border-l">
      {/* Chat panel header */}
      <div className="flex items-center justify-between p-3 border-b bg-secondary/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="font-medium text-sm">Research Assistant</h3>
        </div>
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 mr-1" 
                  onClick={() => setShowCommandHelp(prev => !prev)}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Type /help for commands</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={toggleChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
                    : message.role === 'system'
                      ? 'bg-secondary/50 border border-secondary/70 text-secondary-foreground'
                      : 'bg-muted'
                }`}
              >
                {message.content}
                
                {(message.role === 'assistant' || message.role === 'system') && (
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
          
          {showCommandHelp && (
            <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Mind Map Commands:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li><code>/add [parent-id] [topic]</code> - Add new node</li>
                <li><code>/edit [node-id] [new-topic]</code> - Edit node</li>
                <li><code>/delete [node-id]</code> - Delete node</li>
                <li><code>/move [node-id] [new-parent-id]</code> - Move node</li>
                <li><code>/show</code> - Toggle node IDs</li>
                <li><code>/data</code> - Show mind map JSON</li>
                <li><code>/save</code> - Save mind map</li>
                <li><code>/load</code> - Load saved mind map</li>
                <li><code>/help</code> - Show all commands</li>
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setShowCommandHelp(false)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-10 max-h-32 resize-none"
            placeholder="Ask a question or use /command..."
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
