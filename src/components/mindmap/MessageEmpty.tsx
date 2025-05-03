
import React from "react";
import { FileText, Upload } from "lucide-react";

interface MessageEmptyProps {
  onUploadClick?: () => void;
}

const MessageEmpty: React.FC<MessageEmptyProps> = ({ onUploadClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <FileText className="h-6 w-6 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium mb-2">No PDF Uploaded</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        Please provide me with the study you would like me to analyze. I need the text of the study to identify its limitations and provide page citations.
      </p>
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload a PDF
        </button>
      )}
    </div>
  );
};

export default MessageEmpty;
