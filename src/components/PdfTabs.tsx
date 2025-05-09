
import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PdfMeta = { name: string; size: number; lastModified: number; };

export function getPdfKey(meta: PdfMeta) {
  return `${meta.name}_${meta.size}_${meta.lastModified}`;
}

export function getAllPdfs(): PdfMeta[] {
  const keys = Object.keys(sessionStorage)
    .filter((k) => k.startsWith("pdfMeta_"))
    .map((k) => k.replace("pdfMeta_", ""));
  return keys.map((key) => {
    try {
      return JSON.parse(sessionStorage.getItem(`pdfMeta_${key}`) || "");
    } catch {
      return null;
    }
  }).filter((f): f is PdfMeta => !!f);
}

// Helper function to get a shortened filename
const getShortenedName = (name: string): string => {
  // Get the first part of the filename, up to 15 characters
  return name.length > 15 ? name.substring(0, 15) + '...' : name;
};

interface PdfTabsProps {
  activeKey: string | null;
  onTabChange: (key: string) => void;
  onRemove: (key: string) => void;
  onAddPdf?: () => void;
}

const PdfTabs: React.FC<PdfTabsProps> = ({ activeKey, onTabChange, onRemove, onAddPdf }) => {
  const [pdfMetas, setPdfMetas] = useState<PdfMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load PDF metadata immediately
    setPdfMetas(getAllPdfs());
    
    // Listen for any storage changes
    const handler = () => setPdfMetas(getAllPdfs());
    window.addEventListener("storage", handler);
    window.addEventListener("pdfListUpdated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("pdfListUpdated", handler);
    };
  }, []);

  // Notify when tab changes
  const handleTabChange = (key: string) => {
    setIsLoading(true);
    
    // Set timeout to allow UI to show loading state
    setTimeout(() => {
      onTabChange(key);
      
      // Dispatch an event to inform chat components about tab change
      window.dispatchEvent(
        new CustomEvent('pdfTabChanged', { 
          detail: { activeKey: key } 
        })
      );
      
      // Remove loading state after a brief delay
      setTimeout(() => setIsLoading(false), 100);
    }, 0);
  };

  if (pdfMetas.length === 0 && !onAddPdf) return null;

  return (
    <div className="p-0.5 bg-gray-100 border-b flex items-center h-8">
      <Tabs value={activeKey || undefined} onValueChange={handleTabChange} className="w-full flex-1">
        <TabsList className="h-7 overflow-auto">
          {pdfMetas.map((meta) => (
            <TabsTrigger
              key={getPdfKey(meta)}
              value={getPdfKey(meta)}
              className="h-6 py-0 pr-4 relative text-xs"
              disabled={isLoading}
              title={meta.name}
            >
              <span className="truncate max-w-[120px]">{getShortenedName(meta.name)}</span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onRemove(getPdfKey(meta));
                }}
                tabIndex={-1}
                className="ml-1 absolute right-1 top-0.5"
                title="Remove PDF"
                disabled={isLoading}
              >
                <X className="h-3 w-3 text-gray-400 hover:text-gray-700" />
              </button>
            </TabsTrigger>
          ))}
          {onAddPdf && (
            <TabsTrigger
              key="add-pdf"
              value="add-pdf"
              className="h-6 py-0 px-2 text-xs"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (onAddPdf) onAddPdf();
              }}
              title="Add PDF"
              disabled={isLoading}
            >
              <Plus className="h-3 w-3" />
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      {isLoading && (
        <div className="ml-2 flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default PdfTabs;
