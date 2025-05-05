
/**
 * Create and trigger a download of a Blob as a file
 * @param blob The blob to download
 * @param fileName Name of the file to save as
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
