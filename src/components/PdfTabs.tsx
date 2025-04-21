
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PdfMeta = { name: string; size: number; lastModified: number; };

function getPdfKey(meta: PdfMeta) {
  return `${meta.name}_${meta.size}_${meta.lastModified}`;
}
function getAllPdfs(): PdfMeta[] {
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

interface PdfTabsProps {
  activeKey: string | null;
  onTabChange: (key: string) => void;
  onRemove: (key: string) => void;
}

const PdfTabs: React.FC<PdfTabsProps> = ({ activeKey, onTabChange, onRemove }) => {
  const [pdfMetas, setPdfMetas] = useState<PdfMeta[]>([]);

  useEffect(() => {
    setPdfMetas(getAllPdfs());
    // Listen for any storage changes
    const handler = () => setPdfMetas(getAllPdfs());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (pdfMetas.length === 0) return null;

  return (
    <div className="p-0.5 bg-gray-100 border-b">
      <Tabs value={activeKey || undefined} onValueChange={onTabChange} className="w-full">
        <TabsList className="overflow-auto">
          {pdfMetas.map((meta) => (
            <TabsTrigger
              key={getPdfKey(meta)}
              value={getPdfKey(meta)}
              className="pr-4 relative"
            >
              <span className="truncate max-w-[120px]">{meta.name}</span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onRemove(getPdfKey(meta));
                }}
                tabIndex={-1}
                className="ml-1 absolute right-1 top-1"
                title="Remove PDF"
              >
                <X className="h-3 w-3 text-gray-400 hover:text-gray-700" />
              </button>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default PdfTabs;
