
/**
 * Pre-loaded example questions for the research assistant chat
 */

export const exampleQuestions = [
  "What is this paper about?",
  "Can you explain Figure 3?",
  "What methods did the authors use?",
  "What are the main limitations of this study?",
  "How does this compare to previous research?",
  "Explain this equation in simpler terms",
  "What's the most surprising finding?",
  "Why is this research important?",
];

/**
 * Helper function to get a welcome message with the example questions formatted
 */
export const getWelcomeMessage = (): string => {
  const welcomeMessage = `Hi there! 👋 I'm your research assistant. Let's chat about this paper!
  
Here are some questions you might want to ask:

${exampleQuestions.map(q => `• "${q}"`).join('\n')}

What would you like to know?`;

  return welcomeMessage;
};
