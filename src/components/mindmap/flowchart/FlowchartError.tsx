
import React from "react";
import { AlertTriangle } from "lucide-react";

interface FlowchartErrorProps {
  error: string;
}

const FlowchartError: React.FC<FlowchartErrorProps> = ({ error }) => {
  // Format the error message to be more readable
  const formatErrorMessage = (error: string) => {
    // Extract the most relevant part of parse errors
    if (error.includes("Parse error")) {
      const parseErrorMatch = error.match(/Parse error on line (\d+):[^\n]*\n[^\n]*\n[^-]*(-+\^)/);
      if (parseErrorMatch) {
        return `Syntax error on line ${parseErrorMatch[1]}. The diagram contains invalid Mermaid syntax.`;
      }
    }
    
    // Handle module loading errors more gracefully
    if (error.includes("dynamically imported module") || error.includes("Failed to fetch")) {
      return "Module loading error. The browser had trouble loading the flowchart rendering components.";
    }
    
    // Handle network errors
    if (error.includes("network") || error.includes("fetch") || error.includes("429")) {
      return "Network error. There was a problem connecting to the API to generate the flowchart.";
    }
    
    // Fallback for other errors
    return error.length > 200 ? `${error.substring(0, 200)}...` : error;
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="p-6 rounded-md border flex flex-col items-center text-center bg-amber-50 border-amber-200">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
        <h3 className="font-bold text-lg mb-2 text-amber-800">Flowchart Error</h3>
        <p className="text-sm mb-4 text-amber-700">{formatErrorMessage(error)}</p>
        <pre className="whitespace-pre-wrap text-xs bg-white p-3 rounded-md border border-amber-200 max-h-32 overflow-auto text-left w-full">
          {error}
        </pre>
        <p className="mt-4 text-sm text-amber-600">Using default flowchart template instead. Try uploading a different PDF or refreshing the browser.</p>
      </div>
    </div>
  );
};

export default FlowchartError;
