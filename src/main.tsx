
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Create and insert GPT Engineer script if not already present
function ensureScriptLoaded() {
  if (!document.querySelector('script[src="https://cdn.gpteng.co/gptengineer.js"]')) {
    console.log("GPT Engineer script not found in DOM, inserting it dynamically");
    const script = document.createElement('script');
    script.src = 'https://cdn.gpteng.co/gptengineer.js';
    script.type = 'module';
    document.head.appendChild(script);
  }
}

// Initialize the application with simplified logic
function initializeApp() {
  try {
    // Ensure script is loaded
    ensureScriptLoaded();
    
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("Root element not found!");
      showErrorMessage("Error loading application: Root element not found.");
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

// Start initialization process when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
