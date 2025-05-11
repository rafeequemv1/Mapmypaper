
import React, { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";

// Set up the worker URL - moved here from PdfViewer
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfDocumentViewerProps {
  pdfData: string | null;
  scale: number;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onPageRenderSuccess: (page: any) => void;
  pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
  setPageRef: (index: number) => (element: HTMLDivElement | null) => void;
  getOptimalPageWidth: () => number | undefined;
  numPages: number;
  loadError: string | null;
  isLoading: boolean;
}

const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  pdfData,
  scale,
  onDocumentLoadSuccess,
  onPageRenderSuccess,
  pagesRef,
  setPageRef,
  getOptimalPageWidth,
  numPages,
  loadError,
  isLoading
}) => {
  if (!pdfData) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading PDF...</p>
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-red-500 font-medium mb-2">{loadError || "No PDF available"}</p>
            <p className="text-gray-500">Please upload a PDF document to view it here.</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Document
      file={pdfData}
      onLoadSuccess={onDocumentLoadSuccess}
      className="w-full"
      loading={<div className="text-center py-4">Loading PDF...</div>}
      error={
        <div className="text-center py-4 text-red-500">
          {loadError || "Failed to load PDF. Please try again."}
        </div>
      }
    >
      {Array.from(new Array(numPages), (_, index) => (
        <div
          key={`page_${index + 1}`}
          className="mb-8 shadow-lg bg-white border border-gray-300 transition-colors duration-300 mx-auto"
          ref={setPageRef(index)}
          style={{ width: 'fit-content', maxWidth: '100%' }}
          data-page-number={index + 1}
        >
          <Page
            pageNumber={index + 1}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            onRenderSuccess={onPageRenderSuccess}
            scale={scale}
            width={getOptimalPageWidth()}
            className="mx-auto"
            loading={
              <div className="flex items-center justify-center h-[600px] w-full">
                <div className="animate-pulse bg-gray-200 h-full w-full"></div>
              </div>
            }
          />
          <div className="text-center text-xs text-gray-500 py-2 border-t border-gray-300">
            Page {index + 1} of {numPages}
          </div>
        </div>
      ))}
    </Document>
  );
};

export default PdfDocumentViewer;
