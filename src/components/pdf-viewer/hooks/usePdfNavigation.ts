
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

export function usePdfNavigation() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Initialize the array with the correct number of null elements
    pagesRef.current = Array(numPages).fill(null);
  };

  const onPageRenderSuccess = (page: any) => {
    setPageHeight(page.height);
  };

  // Set page ref - use a stable callback that doesn't cause re-renders
  const setPageRef = (index: number) => (element: HTMLDivElement | null) => {
    if (pagesRef.current && index >= 0 && index < pagesRef.current.length) {
      pagesRef.current[index] = element;
    }
  };

  // Helper function to scroll to position
  const scrollToPosition = (position: string, scrollToPage: (pageNumber: number) => void) => {
    if (position.toLowerCase().startsWith('page')) {
      const pageNumber = parseInt(position.replace(/[^\d]/g, ''), 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        scrollToPage(pageNumber);
      }
    }
  };

  const scrollToPage = (pageNumber: number, activeHighlightRef: HTMLElement | null = null) => {
    if (pageNumber < 1 || pageNumber > numPages) {
      console.warn(`Invalid page number: ${pageNumber}. Pages range from 1 to ${numPages}`);
      return;
    }
    
    console.log(`Scrolling to page: ${pageNumber}`);
    
    const pageIndex = pageNumber - 1; // Convert to 0-based index
    const targetPage = pagesRef.current[pageIndex];
    
    if (targetPage) {
      // Find the scroll container - usually a parent element with scroll capability
      let scrollContainer: HTMLElement | null = targetPage;
      while (scrollContainer && 
            !scrollContainer.querySelector('[data-radix-scroll-area-viewport]')) {
        scrollContainer = scrollContainer.parentElement;
      }
      
      const actualScrollContainer = scrollContainer?.querySelector('[data-radix-scroll-area-viewport]');
      
      if (actualScrollContainer) {
        // Scroll the page into view with smooth animation
        targetPage.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Enhanced flash effect to highlight the page
        targetPage.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
        targetPage.style.transition = 'background-color 0.5s ease-in-out';
        setTimeout(() => {
          targetPage.style.backgroundColor = '';
        }, 1800);
        
        // If we have an active highlight, make it visible
        if (activeHighlightRef) {
          setTimeout(() => {
            const highlights = targetPage.querySelectorAll('.pdf-search-highlight');
            
            // Find the first highlight on the page and make it active
            if (highlights.length > 0) {
              // Remove active class from previous active highlight
              activeHighlightRef.classList.remove('pdf-search-highlight-active');
              
              // Set new active highlight
              const firstHighlight = highlights[0] as HTMLElement;
              firstHighlight.classList.add('pdf-search-highlight-active');
              
              // Make sure the highlight is visible in the viewport
              firstHighlight.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              
              return firstHighlight;
            }
          }, 500); // Give time for the page to be scrolled into view
        }
      }
    }
    
    return null;
  };

  return {
    numPages,
    setNumPages,
    pageHeight,
    pagesRef,
    onDocumentLoadSuccess,
    onPageRenderSuccess,
    setPageRef,
    scrollToPosition,
    scrollToPage
  };
}

export default usePdfNavigation;
