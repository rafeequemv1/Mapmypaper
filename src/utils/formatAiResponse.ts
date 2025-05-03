
// Format AI response with citation links and markdown styling

// Regular expression to match citation pattern [citation:pageX]
const CITATION_REGEX = /\[citation:page(\d+)\]/g;

/**
 * Format AI response with proper styling and citation links
 */
export function formatAIResponse(text: string): string {
  if (!text) return '';
  
  // Convert markdown to HTML
  let formattedText = markdownToHtml(text);
  
  // Add citation links
  formattedText = formattedText.replace(
    CITATION_REGEX,
    '<a href="#" class="citation-link" data-page="$1">[page $1]</a>'
  );
  
  return formattedText;
}

/**
 * Simple markdown to HTML converter for AI responses
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet lists
  html = html.replace(/^\s*-\s*(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Convert numbered lists
  html = html.replace(/^\s*\d+\.\s*(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
  
  // Convert code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
  
  // Convert inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Convert paragraphs (preserve line breaks)
  html = html.split(/\n{2,}/).map(para => `<p>${para}</p>`).join('');
  
  return html;
}

/**
 * Activate citation links in the formatted content
 */
export function activateCitations(
  element: HTMLElement,
  onCitationClick: (citation: string) => void
): void {
  const citationLinks = element.querySelectorAll('.citation-link');
  
  citationLinks.forEach(link => {
    if (link instanceof HTMLElement) {
      // Remove any existing event listeners
      const clone = link.cloneNode(true);
      if (link.parentNode) {
        link.parentNode.replaceChild(clone, link);
      }
      
      // Add new click event listener
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        const pageNumber = (clone as HTMLElement).dataset.page;
        if (pageNumber) {
          onCitationClick(pageNumber);
          
          // Highlight the clicked citation
          document.querySelectorAll('.citation-link-active').forEach(el => {
            el.classList.remove('citation-link-active');
          });
          clone.classList.add('citation-link-active');
        }
      });
    }
  });
}
