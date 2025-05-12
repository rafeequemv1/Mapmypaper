
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded, initialize immediately
  initializeApp();
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
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error loading application</h1><p>Please refresh the page or contact support.</p></div>';
  }
}
