
import React, { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/components/chat/useChat";
import { Skeleton } from "@/components/ui/skeleton";

// Use React.lazy instead of Next.js dynamic import
const MindElixir = lazy(() => import('@mind-elixir/next'));
const PdfViewer = lazy(() => import('@/components/PdfViewer'));

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (mindMap: any) => void;
  explainText: string;
  onExplainText: (text: string) => void;
}

// Add a new prop to handle image capture
const PanelStructure: React.FC<PanelStructureProps> = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
}) => {
  const searchParams = useSearchParams();
  const pdfViewerRef = useRef<any>(null);
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

  const initialData = {
    "nodeData": {
      "id": "4p5jnix2x9j0",
      "topic": "Central Topic",
      "root": true,
      "children": [],
      "tags": [],
      "icons": [],
      "hyperLink": "",
      "note": "",
      "style": {
        "fontSize": "24px"
      }
    },
    "linkData": {}
  };

  const options = {
    el: '#mindmap',
    newTopicName: 'Topic',
    data: initialData,
    direction: 'LEFT', // We'll apply the direction property to MindElixir component
    locale: 'en',
    draggable: true,
    editable: true,
    contextMenu: true,
    toolBar: false,
    nodeMenu: true,
    keypress: true,
    before: {
      insertNode: (newNode: any, node: any) => {
        console.log('insertNode', newNode, node);
        return true;
      },
      moveNode: (node: any, newParent: any, originParent: any) => {
        console.log('moveNode', node, newParent, originParent);
        return true;
      },
      textEdit: (originText: string, newText: string, node: any) => { // Fixed non-English character
        console.log('textEdit', originText, newText, node);
        return true;
      },
      removeNode: (node: any) => {
        console.log('removeNode', node);
        return true;
      },
      focusNode: (node: any) => {
        console.log('focusNode', node);
        return true;
      },
    },
  };

  const handleMindMapReady = (mindMap: any) => {
    // Set up the mind map instance with proper line breaks for nodes
    if (onMindMapReady) {
      onMindMapReady(mindMap);
    }
  };

  // Add a handler for image capture
  const handleImageCaptured = (imageData: string) => {
    // Send the captured image data to the chat
    if (onExplainText) {
      onExplainText(`[IMAGE CAPTURE]: Please explain this part of the PDF: ${imageData}`);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* PDF Panel */}
      {showPdf && (
        <div className="w-1/3 h-full border-r border-gray-200 overflow-hidden">
          <Suspense fallback={<div className="h-full flex items-center justify-center"><Skeleton className="w-[200px] h-[30px]" /></div>}>
            <PdfViewer
              onTextSelected={onExplainText}
              onPdfLoaded={handlePdfLoaded}
              ref={pdfViewerRef}
              onImageCaptured={handleImageCaptured}
            />
          </Suspense>
        </div>
      )}

      {/* MindMap Panel */}
      <div className={`flex-1 h-full ${showChat ? 'border-r border-gray-200' : ''} overflow-hidden`}>
        <div className="h-full" style={{ overflow: 'auto' }}>
          <div id="mindmap" className="h-full" style={{ overflow: 'hidden' }}>
            {loadingMindmap ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="w-[200px] h-[30px]" />
              </div>
            ) : null}
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Skeleton className="w-[200px] h-[30px]" /></div>}>
              <MindElixir
                options={options}
                onload={(mind: any) => {
                  console.log("Mind map loaded:", mind);
                  handleMindMapReady(mind);
                  setLoadingMindmap(false);
                }}
                className="h-full"
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-1/3 h-full flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Chat</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className={`mb-2 p-3 rounded-md ${message.isUser ? 'bg-blue-100 text-blue-800 self-end' : 'bg-gray-100 text-gray-800 self-start'}`}>
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
        </div>
      )}
    </div>
  );
};

export default PanelStructure;
