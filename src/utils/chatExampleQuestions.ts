
/**
 * Pre-loaded example questions for the research assistant chat
 */

export const exampleQuestions = [
  "What is the main finding of this paper?",
  "Summarize the methodology used in this study.",
  "Explain Figure 2 in detail.",
  "What are the limitations mentioned in the discussion?",
  "How does this paper compare to previous work in the field?",
  "What statistical methods were used in the analysis?",
  "Can you explain the key equations in simpler terms?",
  "What are the practical implications of these findings?",
];

/**
 * Helper function to get a welcome message with the example questions formatted
 */
export const getWelcomeMessage = (): string => {
  const welcomeMessage = `Hello! 👋 I'm your research assistant. I can help you understand the paper you've uploaded. 
  
Here are some questions you might want to ask:

${exampleQuestions.map(q => `• "${q}"`).join('\n')}

What would you like to know about this paper?`;

  return welcomeMessage;
};
