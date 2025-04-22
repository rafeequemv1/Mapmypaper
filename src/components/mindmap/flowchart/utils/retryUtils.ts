
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
  maxRetries: number = 3
): Promise<string> => {
  try {
    return await generateFn();
  } catch (error: any) {
    // Check if this is a rate limit error (429)
    if (error.message && error.message.includes('429') && retryCount < maxRetries) {
      // Calculate exponential backoff time (1s, 2s, 4s, etc.)
      const backoffTime = Math.pow(2, retryCount) * 1000;
      
      console.log(`Rate limit reached. Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Wait for backoff time
      await wait(backoffTime);
      
      // Try again
      return generateWithRetry(generateFn, retryCount + 1, maxRetries);
    }
    
    // If not a rate limit error or we've exhausted retries, throw the error
    throw error;
  }
};
