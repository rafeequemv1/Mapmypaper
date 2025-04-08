
/**
 * Pre-loaded example questions for the research assistant chat
 * Includes both paper-specific and generic research questions
 */

// These questions will be dynamically replaced with paper-specific ones when possible
export const exampleQuestions = [
  "What's the main finding?",
  "Explain Figure 1",
  "Summarize the methods",
  "What are the limitations?",
  "Key takeaways?",
  "ELI5: this paper",
  "Compare to prior work",
  "Practical applications?",
];

/**
 * Helper function to get a concise welcome message with the example questions formatted
 */
export const getWelcomeMessage = (): string => {
  const welcomeMessage = `👋 Ask me about this paper!`;
  return welcomeMessage;
};

/**
 * Get context-specific example questions based on document content
 * @param documentContent Optional document content to analyze
 * @returns Array of questions tailored to the document
 */
export const getContextualQuestions = (documentContent?: string): string[] => {
  // If document content is provided, analyze it to generate relevant questions
  if (documentContent) {
    try {
      // Extract paper title if present
      const titleMatch = documentContent.match(/(?:title|Title):\s*([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : null;
      
      // Check for figures
      const hasFigures = documentContent.match(/(?:figure|Figure|Fig\.|fig\.)\s*\d+/i);
      
      // Check for tables
      const hasTables = documentContent.match(/(?:table|Table)\s*\d+/i);
      
      // Check for methods section
      const hasMethods = documentContent.match(/(?:method|Method|methodology|experiment|procedure)s?/i);
      
      // Check for results section
      const hasResults = documentContent.match(/(?:result|Result|finding|outcome)s?/i);
      
      // Generate contextual questions based on document structure
      const contextQuestions: string[] = [];
      
      if (title) {
        contextQuestions.push(`What's "${title}" about?`);
      }
      
      if (hasFigures) {
        contextQuestions.push("Explain the main figure");
      }
      
      if (hasTables) {
        contextQuestions.push("What do the tables show?");
      }
      
      if (hasMethods) {
        contextQuestions.push("Summarize the methods");
      }
      
      if (hasResults) {
        contextQuestions.push("What are the key results?");
      }
      
      // Add some generic questions
      contextQuestions.push("What's the significance?");
      contextQuestions.push("Main limitations?");
      
      // Return a mix of contextual and generic questions (up to 6 total)
      return contextQuestions.slice(0, 6);
    } catch (error) {
      console.error("Error generating contextual questions:", error);
      // Fall back to default questions if analysis fails
      return exampleQuestions;
    }
  }
  
  // Return default examples if no document content is provided
  return exampleQuestions;
};
