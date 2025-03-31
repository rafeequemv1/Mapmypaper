
/**
 * Formats AI responses with enhanced typography and structure
 * Converts markdown syntax to properly styled HTML and adds citation support
 */
export const formatAIResponse = (content: string): string => {
  // Process citations first to avoid conflicts with other formatting
  // Format improved for numeric citations: [citation:page123] -> clickable citation link with just the number
  let formattedContent = content.replace(
    /\[citation:page(\d+)\]/g, 
    '<span class="citation" data-citation="page$1" role="button" tabindex="0"><sup class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium hover:bg-blue-200 cursor-pointer">$1</sup></span>'
  );
  
  // Standard citation format as fallback
  formattedContent = formattedContent.replace(
    /\[citation:([^\]]+)\]/g, 
    '<span class="citation" data-citation="$1" role="button" tabindex="0"><sup class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium hover:bg-blue-200 cursor-pointer">ref</sup></span>'
  );
  
  // Replace markdown headers with properly styled HTML headers
  formattedContent = formattedContent
    // Format headers with enhanced styling and proper hierarchy
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6 pb-2 border-b border-gray-200 text-blue-800">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-5 text-blue-700">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4 text-indigo-600">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="text-base font-medium mb-2 mt-3 text-indigo-500">$1</h4>')
    
    // Format bold, italics and strikethrough with enhanced styling
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>')
    
    // Format lists with proper indentation and styling
    .replace(/^\* (.*$)/gim, '<ul class="my-3 ml-5 space-y-2 list-disc"><li class="mb-1 pl-1">$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul class="my-3 ml-5 space-y-2 list-disc"><li class="mb-1 pl-1">$1</li></ul>')
    .replace(/^\d\. (.*$)/gim, '<ol class="my-3 ml-5 space-y-2 list-decimal"><li class="mb-1 pl-1">$1</li></ol>')
    
    // Format code blocks with improved styling
    .replace(/```(.+?)```/gs, '<pre class="bg-gray-100 p-3 rounded my-3 overflow-x-auto text-sm font-mono shadow-sm">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-pink-600 font-mono">$1</code>')
    
    // Format links with accessible styling
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800 font-medium">$1</a>')
    
    // Format paragraphs with proper spacing and line height
    .replace(/^\s*$(?:\r\n?|\n)/gm, '</p><p class="mb-3 text-base leading-relaxed">')
    
    // Format blockquotes with enhanced styling
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-400 pl-4 italic my-4 bg-blue-50 py-3 pr-3 rounded-r text-gray-700">$1</blockquote>')
    
    // Format horizontal rules
    .replace(/^---$/gim, '<hr class="my-6 border-t border-gray-300" />')
    
    // Format tables with responsive styling
    .replace(/\|(.+)\|/g, '<div class="overflow-x-auto"><table class="min-w-full border-collapse my-4 shadow-sm"><tr>$1</tr></table></div>')
    .replace(/\|---\|/g, '');

  // Wrap the result in a paragraph if it doesn't start with an HTML tag
  if (!formattedContent.startsWith('<')) {
    formattedContent = '<p class="mb-3 text-base leading-relaxed">' + formattedContent;
  }
  
  // Add closing paragraph if needed
  if (!formattedContent.endsWith('>')) {
    formattedContent = formattedContent + '</p>';
  }
  
  // Fix nested list items by combining adjacent list items
  formattedContent = formattedContent
    .replace(/<\/ul>\s*<ul class="my-3 ml-5 space-y-2 list-disc">/g, '')
    .replace(/<\/ol>\s*<ol class="my-3 ml-5 space-y-2 list-decimal">/g, '');
  
  return formattedContent;
};

/**
 * Adds event listeners to citation elements in the message content
 * @param container - The container element with citation elements
 * @param onCitationClick - Callback function when a citation is clicked
 */
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
        onCitationClick(citationData);
      });
      
      // Add keyboard event listener for accessibility
      newCitationElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log("Citation activated by keyboard: ", citationData);
          onCitationClick(citationData);
        }
      });
    }
  });
};
