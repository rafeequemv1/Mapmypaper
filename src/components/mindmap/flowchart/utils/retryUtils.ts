
/**
 * Wait for a specified amount of time
 * @param ms Time to wait in milliseconds
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try to generate a flowchart with exponential backoff for rate limit errors
 */
export const generateWithRetry = async (
  generateFn: () => Promise<string>,
  retryCount: number,
  maxRetries: number = 5, // Increased from 3 to 5
  initialBackoff: number = 2000 // Start with a 2-second backoff
): Promise<string> => {
  try {
    return await generateFn();
  } catch (error: any) {
    // Check if this is a rate limit error (429)
    if ((error.message && (
        error.message.includes('429') || 
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('quota exceeded')
      )) && retryCount < maxRetries) {
      
      // Calculate exponential backoff time (2s, 4s, 8s, 16s, 32s)
      const backoffTime = initialBackoff * Math.pow(2, retryCount);
      
      console.log(`Rate limit reached. Retrying in ${backoffTime/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Wait for backoff time
      await wait(backoffTime);
      
      // Try again with incremented retry count
      return generateWithRetry(generateFn, retryCount + 1, maxRetries, initialBackoff);
    }
    
    // If not a rate limit error or we've exhausted retries, throw the error
    throw error;
  }
};

/**
 * Check if an error is a rate limit error
 */
export const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || String(error);
  return (
    errorMessage.includes('429') || 
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('quota exceeded')
  );
};
