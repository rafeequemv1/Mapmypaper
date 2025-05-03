
import React from 'react';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageEmptyProps {
  onUploadClick?: () => void;
}

const MessageEmpty: React.FC<MessageEmptyProps> = ({ onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium mb-2">No documents loaded</h3>
      
      <p className="text-gray-500 mb-6 max-w-md">
        Upload a PDF document to chat with the research assistant about its contents.
      </p>
      
      <Button 
        onClick={onUploadClick} 
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Upload PDF
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default MessageEmpty;
