import { useRef, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/components/chat/useChat";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
}: PanelStructureProps) => {
  const searchParams = useSearchParams();
  const pdfViewerRef = useRef(null);
  const isMapGenerated = true;
  
  const [loadingMindmap, setLoadingMindmap] = useState(true);
  const { toast } = useToast();
  const { messages, input, handleInputChange, sendMessage, isLoading: isChatLoading } = useChat(explainText);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  
  const handlePdfLoaded = useCallback(() => {
    setPdfLoaded(true);
  }, []);
  
  useEffect(() => {
    if (explainText && !isChatLoading) {
      sendMessage(explainText);
    }
  }, [explainText, sendMessage, isChatLoading]);

  // Handle image capture from PDF
  const handleImageCaptured = (imageData: string) => {
    if (onExplainText) {
      onExplainText(`[IMAGE CAPTURE]: Please explain this part of the PDF: ${imageData}`);
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      {/* PDF Panel */}
      {showPdf && (
        <>
          <ResizablePanel defaultSize={30} minSize={15} maxSize={50} className="h-full">
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
              onPdfLoaded={handlePdfLoaded}
              onImageCaptured={handleImageCaptured}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <ResizablePanel defaultSize={showChat ? 50 : 70} className="h-full">
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
        />
      </ResizablePanel>

      {/* Chat Panel */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="h-full bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-2 p-3 rounded-md ${message.isUser ? 'bg-blue-100 text-blue-800 self-end' : 'bg-gray-100 text-gray-800 self-start'}`}
                >
                  {message.text}
                </div>
              ))}
              {isChatLoading && (
                <div className="mb-2 p-3 rounded-md bg-gray-100 text-gray-800 self-start">
                  Loading...
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                  placeholder="Enter text"
                  value={input}
                  onChange={handleInputChange}
                />
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium rounded-r-md text-white py-2 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={() => sendMessage()}
                >
                  Send
                </button>
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
