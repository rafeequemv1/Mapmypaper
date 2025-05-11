
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

export function usePdfSearch() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [activeHighlightRef, setActiveHighlightRef] = useState<HTMLElement | null>(null);
  const { toast } = useToast();
  
  // Toggle search visibility
  const toggleSearch = () => {
    setShowSearch(prevState => !prevState);
    if (!showSearch) {
      // Reset search results when opening search
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return null;
    
    // Get all text content from PDF pages
    const results: string[] = [];
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
    
    // Reset previous highlights
    document.querySelectorAll('.pdf-search-highlight').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '';
      el.classList.remove('pdf-search-highlight');
    });
    
    // Reset active highlight if any
    if (activeHighlightRef) {
      activeHighlightRef.classList.remove('pdf-search-highlight-active');
      setActiveHighlightRef(null);
    }
    
    textLayers.forEach((layer, pageIndex) => {
      const textContent = layer.textContent || '';
      const regex = new RegExp(searchQuery, 'gi');
      let match;
      let hasMatch = false;
      
      // Find matches and create an array of page numbers
      while ((match = regex.exec(textContent)) !== null) {
        results.push(`page${pageIndex + 1}`);
        hasMatch = true;
      }
      
      // Only proceed with highlighting if there was a match on this page
      if (hasMatch) {
        // Highlight text in the PDF with more visible yellow background
        if (layer.childNodes) {
          layer.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.parentElement && node.textContent) {
              const parent = node.parentElement;
              
              // Apply highlight to matching text
              const nodeText = parent.textContent || '';
              const lowerNodeText = nodeText.toLowerCase();
              const lowerSearchQuery = searchQuery.toLowerCase();
              
              if (lowerNodeText.includes(lowerSearchQuery)) {
                parent.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                parent.classList.add('pdf-search-highlight');
                
                // Apply pulsing animation to make highlighting more noticeable
                parent.style.transition = 'background-color 0.5s ease-in-out';
              }
            }
          });
        }
      }
    });
    
    // Remove duplicates
    const uniqueResults = [...new Set(results)];
    setSearchResults(uniqueResults);
    
    // Style for the highlights
    const style = document.createElement('style');
    style.innerHTML = `
      .pdf-search-highlight {
        background-color: rgba(255, 255, 0, 0.5) !important;
        border-radius: 2px;
        padding: 0 1px;
      }
      .pdf-search-highlight-active {
        background-color: rgba(255, 165, 0, 0.7) !important;
        box-shadow: 0 0 2px 2px rgba(255, 165, 0, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    if (uniqueResults.length > 0) {
      setCurrentSearchIndex(0);
      toast({
        title: "Search Results",
        description: `Found ${uniqueResults.length} occurrences of "${searchQuery}"`,
      });
      return uniqueResults[0]; // Return the first result for scrolling
    } else {
      toast({
        title: "No results found",
        description: `Could not find "${searchQuery}" in the document.`,
      });
      return null;
    }
  };
  
  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return null;
    
    // Remove active highlight from current result
    if (activeHighlightRef) {
      activeHighlightRef.classList.remove('pdf-search-highlight-active');
    }
    
    let newIndex = currentSearchIndex;
    
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    return searchResults[newIndex]; // Return the position to scroll to
  };

  // Handle search input keydown event
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSearch(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    showSearch,
    toggleSearch,
    handleSearch,
    navigateSearch,
    handleSearchKeyDown,
    activeHighlightRef,
    setActiveHighlightRef
  };
}

export default usePdfSearch;
