
import { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCw, Search, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PdfToolbarProps {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isSnapshotMode: boolean;
  toggleSnapshotMode: () => void;
  handleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: string[];
  currentSearchIndex: number;
  toggleSearch: () => void;
  navigateSearch: (direction: 'next' | 'prev') => void;
  showSearch: boolean;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const PdfToolbar: React.FC<PdfToolbarProps> = ({
  scale,
  zoomIn,
  zoomOut,
  resetZoom,
  isSnapshotMode,
  toggleSnapshotMode,
  handleSearch,
  searchQuery,
  setSearchQuery,
  searchResults,
  currentSearchIndex,
  toggleSearch,
  navigateSearch,
  showSearch,
  handleSearchKeyDown,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus search input when search is opened
  useState(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  });

  return (
    <div className="bg-white border-b px-1 py-0 flex flex-nowrap items-center justify-between gap-0.5 z-10 min-h-[30px] h-8">
      {/* Zoom Controls with percentage display */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-black p-0" 
          onClick={zoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="text-xs w-10 text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-black p-0" 
          onClick={zoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-black p-0" 
          onClick={resetZoom}
          title="Reset Zoom"
        >
          <RotateCw className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Search Section - Modified to be toggled */}
      <div className="flex-1 mx-0.5">
        {showSearch ? (
          <div className="flex items-center">
            <Input
              ref={searchInputRef}
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 text-xs mr-0.5"
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 flex items-center gap-0.5 text-black px-1"
              onClick={handleSearch}
            >
              <Search className="h-3 w-3" />
              <span className="text-xs">Find</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 flex items-center text-black px-1"
              onClick={toggleSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            {/* Add Draw to Capture Button next to Search */}
            <Button 
              variant={isSnapshotMode ? "primary" : "ghost"}
              size="sm" 
              className={`h-6 flex items-center gap-0.5 px-1 mr-2 ${isSnapshotMode ? "bg-blue-500 text-white" : "text-black"}`}
              onClick={toggleSnapshotMode}
              title={isSnapshotMode ? "Cancel capture" : "Draw to capture"}
            >
              <Camera className="h-3 w-3" />
              <span className="text-xs">{isSnapshotMode ? "Cancel" : "Capture"}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 flex items-center gap-0.5 text-black px-1"
              onClick={toggleSearch}
            >
              <Search className="h-3 w-3" />
              <span className="text-xs">Search</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Search Navigation - Only show when search results exist */}
      {searchResults.length > 0 && showSearch && (
        <div className="flex items-center gap-1">
          <span className="text-xs">
            {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div className="flex gap-0.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1 text-black"
              onClick={() => navigateSearch('prev')}
            >
              ←
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1 text-black"
              onClick={() => navigateSearch('next')}
            >
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToolbar;
