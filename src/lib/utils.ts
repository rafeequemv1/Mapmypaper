
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Saves mind map data to session storage
 * @param data The mind map data to save
 */
export function saveMindMapData(data: any): void {
  try {
    // Convert the data to a JSON string
    const jsonData = JSON.stringify(data);
    
    // Save the data to session storage
    sessionStorage.setItem('mindMapData', jsonData);
    
    console.log('Mind map data saved to session storage');
  } catch (error) {
    console.error('Error saving mind map data:', error);
  }
}
