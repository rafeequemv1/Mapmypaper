/**
 * Formats AI responses with enhanced typography and structure
 * Converts markdown syntax to properly styled HTML and adds citation support
 * Optimized for concise, simplified responses with a more conversational tone
 */
export const formatAIResponse = (content: string): string => {
  // Add relevant emojis based on content but don't overdo it
  const addEmojis = (text: string): string => {
    // We'll be more selective with emoji additions to keep it natural
    
    // Add emoji for important facts - only if not already present
    if (!text.includes('📌') && !text.includes('🔑')) {
      text = text.replace(/important fact|key point/gi, (match) => {
        return match.toLowerCase().includes('important') ? '📌 Important fact' : '🔑 Key point';
      });
    }
    
    // Add emoji for explanations - only if not already present
    if (!text.includes('💡') && !text.includes('🔍')) {
      text = text.replace(/to explain|for example/gi, (match) => {
        return match.toLowerCase().includes('explain') ? '💡 To explain' : '🔍 For example';
      });
    }
    
    // Add emoji for conclusions - only if not already present
    if (!text.includes('🏁') && !text.includes('📋')) {
      text = text.replace(/in conclusion|to summarize/gi, (match) => {
        return match.toLowerCase().includes('conclusion') ? '🏁 In conclusion' : '📋 To summarize';
      });
    }
    
    // Add emoji for references to pages - only if not already present
    if (!text.includes('📄')) {
      text = text.replace(/on page \d+/gi, (match) => `📄 ${match}`);
    }
    
    // Add emoji for warnings or cautions - only if not already present
    if (!text.includes('⚠️')) {
      text = text.replace(/caution|warning|note/gi, '⚠️ $&');
    }
    
    return text;
  };

  // First process the content with emojis - more subtle now
  let formattedContent = addEmojis(content);
  
  // Process citations - format as small circular badges with just the page number
  formattedContent = formattedContent.replace(
    /\[citation:page(\d+)\]/g, 
    (match, pageNum) => {
      const pageNumber = parseInt(pageNum, 10);
      // Ensure page number is valid (assuming maximum 7 pages based on console logs)
      const validPageNumber = pageNumber > 0 && pageNumber <= 7 ? pageNumber : 1;
      return `<span class="citation" data-citation="page${validPageNumber}" role="button" tabindex="0" title="Click to navigate to page ${validPageNumber}"><sup class="inline-flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-sm transition-transform duration-150 ease-in-out">${validPageNumber}</sup></span>`;
    }
  );
  
  // Standard citation format as fallback - showing citation text in circles
  formattedContent = formattedContent.replace(
    /\[citation:([^\]]+)\]/g, 
    (match, citation) => {
      // Extract page number if present in the citation text
      const pageMatch = citation.match(/page\s*(\d+)/i);
      if (pageMatch) {
        const pageNum = pageMatch[1];
        const pageNumber = parseInt(pageNum, 10);
        // Ensure page number is valid (assuming maximum 7 pages based on console logs)
        const validPageNumber = pageNumber > 0 && pageNumber <= 7 ? pageNumber : 1;
        return `<span class="citation" data-citation="page${validPageNumber}" role="button" tabindex="0" title="Click to navigate to page ${validPageNumber}"><sup class="inline-flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-sm transition-transform duration-150 ease-in-out">${validPageNumber}</sup></span>`;
      }
      // If no page number found, just show the first few characters
      const shortCite = citation.length > 3 ? citation.substring(0, 3) : citation;
      return `<span class="citation" data-citation="${citation}" role="button" tabindex="0" title="Click to navigate to ${citation}"><sup class="inline-flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-sm transition-transform duration-150 ease-in-out">${shortCite}</sup></span>`;
    }
  );
  
  // Replace markdown headers with more natural styling
  formattedContent = formattedContent
    // Format headers with minimalist styling but slightly larger for better readability
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mb-2 mt-4 text-primary-800">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-semibold mb-1.5 mt-3 text-primary-700">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-medium mb-1 mt-2 text-indigo-600">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="text-xs font-medium mb-1 mt-1.5 text-indigo-500">$1</h4>')
    
    // Format bold, italics and strikethrough with minimal styling
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>')
    
    // Format lists with a more natural style
    .replace(/^\* (.*$)/gim, '<ul class="my-1 ml-4 list-disc"><li class="mb-1 text-sm">$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul class="my-1 ml-4 list-disc"><li class="mb-1 text-sm">$1</li></ul>')
    .replace(/^(\d+)\. (.*$)/gim, '<ol class="my-1 ml-4 list-decimal"><li class="mb-1 text-sm" value="$1">$2</li></ol>')
    
    // Format code blocks with compact styling
    .replace(/```(.+?)```/gs, '<pre class="bg-gray-100 p-2 rounded my-1.5 overflow-x-auto text-xs font-mono shadow-sm">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs text-pink-600 font-mono">$1</code>')
    
    // Format links with minimal styling
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/90">$1</a>')
    
    // Format paragraphs with slightly more spacing for readability
    .replace(/^\s*$(?:\r\n?|\n)/gm, '</p><p class="mb-2 text-sm leading-relaxed">')
    
    // Format blockquotes with minimal styling but better readability
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-primary/40 pl-3 my-2 bg-primary/5 py-1.5 text-sm text-gray-700">$1</blockquote>')
    
    // Format horizontal rules
    .replace(/^---$/gim, '<hr class="my-3 border-t border-gray-300" />')
    
    // Format tables with compact styling
    .replace(/\|(.+)\|/g, '<div class="overflow-x-auto text-xs"><table class="min-w-full border-collapse my-2"><tr>$1</tr></table></div>')
    .replace(/\|---\|/g, '');

  // Make the formatting cleaner and more readable
  formattedContent = formattedContent
    .replace(/<p>/g, '<p class="mb-2 text-sm leading-relaxed">')
    .replace(/<li>/g, '<li class="mb-1 text-sm">');

  // Wrap the result in a paragraph if it doesn't start with an HTML tag
  if (!formattedContent.startsWith('<')) {
    formattedContent = '<p class="mb-2 text-sm leading-relaxed">' + formattedContent;
  }
  
  // Add closing paragraph if needed
  if (!formattedContent.endsWith('>')) {
    formattedContent = formattedContent + '</p>';
  }
  
  // Fix nested list items by combining adjacent list items
  formattedContent = formattedContent
    .replace(/<\/ul>\s*<ul class="my-1 ml-4 list-disc">/g, '')
    .replace(/<\/ol>\s*<ol class="my-1 ml-4 list-decimal">/g, '');
  
  return formattedContent;
};

// Keep the activateCitations function unchanged
export const activateCitations = (container: HTMLElement, onCitationClick: (citation: string) => void): void => {
  const citations = container.querySelectorAll('.citation');
  
  citations.forEach(citation => {
    const citationElement = citation as HTMLElement;
    const citationData = citationElement.dataset.citation;
    
    if (citationData) {
      // Remove existing event listeners if any
      const newElement = citationElement.cloneNode(true);
      citationElement.parentNode?.replaceChild(newElement, citationElement);
      const newCitationElement = newElement as HTMLElement;
      
      // Add click event listener to the citation
      newCitationElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Citation clicked: ", citationData);
        
        // First directly call the callback to ensure it's processed
        onCitationClick(citationData);
        
        // Extract page number and ensure it's within valid range (1-7)
        if (citationData.toLowerCase().startsWith('page')) {
          const pageNumber = parseInt(citationData.replace(/[^\d]/g, ''), 10);
          if (!isNaN(pageNumber)) {
            const validPageNumber = Math.min(Math.max(pageNumber, 1), 7);
            
            // Create and dispatch custom event with page number
            setTimeout(() => {
              const event = new CustomEvent('scrollToPdfPage', { 
                detail: { pageNumber: validPageNumber }
              });
              window.dispatchEvent(event);
              console.log(`Dispatched scrollToPdfPage event with page: ${validPageNumber}`);
            }, 50);
          }
        }
      });
      
      // Add keyboard event listener for accessibility
      newCitationElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          console.log("Citation activated by keyboard: ", citationData);
          onCitationClick(citationData);
        }
      });
      
      // Add hover effect for better UX
      newCitationElement.addEventListener('mouseenter', () => {
        newCitationElement.style.transform = 'scale(1.1)';
        newCitationElement.style.boxShadow = '0 0 3px 2px rgba(0,0,0,0.1)';
      });
      
      newCitationElement.addEventListener('mouseleave', () => {
        newCitationElement.style.transform = 'scale(1)';
        newCitationElement.style.boxShadow = '';
      });
      
      // Add tooltip for better UX - show page info on hover
      newCitationElement.setAttribute('title', `Click to navigate to ${citationData}`);
    }
  });
};
