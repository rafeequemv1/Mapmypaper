
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface FlowchartEditorProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  onCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onRegenerate: () => void;
}

const FlowchartEditor = ({ 
  code, 
  error, 
  isGenerating, 
  onCodeChange, 
  onRegenerate 
}: FlowchartEditorProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Mermaid Code</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRegenerate} 
          disabled={isGenerating}
          className="flex items-center gap-1"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {isGenerating ? "Generating..." : "Regenerate"}
        </Button>
      </div>
      <Textarea
        value={code}
        onChange={onCodeChange}
        className="flex-1 font-mono text-sm resize-none"
        placeholder="Enter your Mermaid flowchart code here..."
      />
      {error && (
        <div className="mt-2 text-red-500 text-sm overflow-auto max-h-24 bg-red-50 p-2 rounded border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default FlowchartEditor;
