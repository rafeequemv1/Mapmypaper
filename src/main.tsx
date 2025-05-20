
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Initialize the app with proper error handling and script loading checks
if (typeof window !== 'undefined') {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeWithRetry(10));
  } else {
    // DOM already loaded, initialize with retry mechanism
    initializeWithRetry(10);
  }
}

// Retry mechanism for initialization
function initializeWithRetry(maxRetries: number, delay: number = 300) {
  if (maxRetries <= 0) {
    console.error("Failed to load GPT Engineer script after maximum retries");
    showErrorMessage("Failed to load required scripts. Please refresh the page.");
    return;
  }
  
  try {
    // Check if the GPT Engineer script is loaded
    if (typeof window.S === 'undefined') {
      console.warn(`GPT Engineer script not fully loaded. Retrying in ${delay}ms... (${maxRetries} attempts left)`);
      setTimeout(() => initializeWithRetry(maxRetries - 1, delay * 1.5), delay);
      return;
    }
    
    // Script is loaded, initialize the app
    initializeApp();
  } catch (error) {
    console.error("Error during initialization:", error);
    setTimeout(() => initializeWithRetry(maxRetries - 1, delay * 1.5), delay);
  }
}

function initializeApp() {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("Root element not found!");
      document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error loading application</h1><p>Root element not found. Please refresh the page or contact support.</p></div>';
      return;
    }
    
    // Clear any existing content in the root element to prevent conflicts
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("React application successfully rendered");
  } catch (error) {
    console.error("Failed to render React application:", error);
    showErrorMessage("Failed to render application. Please refresh the page.");
  }
}

function showErrorMessage(message: string) {
  document.body.innerHTML = `<div style="padding: 20px; text-align: center;"><h1>Error loading application</h1><p>${message}</p></div>`;
}
