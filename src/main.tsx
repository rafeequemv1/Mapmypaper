
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Ensure React and ReactDOM are properly initialized
console.info("Initializing React application...");
console.info("React version:", React.version);

// Get the root element with error handling
const rootElement = document.getElementById("root");

// Safety check to ensure the element exists
if (!rootElement) {
  console.error("Root element not found. Cannot mount React application.");
} else {
  try {
    // Create the root with additional safeguards
    console.info("Creating React root...");
    const root = createRoot(rootElement);
    
    // Render with error boundary wrapper
    console.info("Rendering React application...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.info("React application mounted successfully");
  } catch (error) {
    console.error("Failed to render React application:", error);
    
    // Display fallback error UI directly in the DOM
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: sans-serif;">
          <h2 style="color: #d32f2f;">Application Error</h2>
          <p>Sorry, something went wrong while loading the application.</p>
          <p style="font-size: 12px; color: #666;">Technical details: ${error instanceof Error ? error.message : String(error)}</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 16px;">
            Reload Application
          </button>
        </div>
      `;
    }
  }
}
