
import React from "react";
import { Button } from "@/components/ui/button";
import { FileUp, BookOpen } from "lucide-react";

interface MessageEmptyProps {
  onUploadClick: () => void;
}

const MessageEmpty: React.FC<MessageEmptyProps> = ({ onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
      <div className="p-4 bg-blue-50 rounded-full">
        <BookOpen className="h-10 w-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-medium">No documents loaded</h3>
      <p className="text-gray-500 max-w-md">
        Upload a PDF document to start analyzing it with the research assistant
      </p>
      <Button onClick={onUploadClick} className="flex items-center space-x-2">
        <FileUp className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    </div>
  );
};

export default MessageEmpty;
