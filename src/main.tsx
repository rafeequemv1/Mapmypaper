
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
    return false;
  }
  return true;
}

// Check if window.S exists or wait for it
function checkGptEngineered(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.S !== 'undefined') {
      console.log("GPT Engineer script loaded successfully");
      resolve(true);
      return;
    }
    
    // If script doesn't exist, ensure it's loaded
    ensureScriptLoaded();
    
    // Wait a bit and try again with exponential backoff
    let attempts = 0;
    const maxAttempts = 20;
    let timeout = 300;
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof window.S !== 'undefined') {
        console.log(`GPT Engineer script loaded after ${attempts} attempts`);
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error(`Failed to load GPT Engineer script after ${maxAttempts} attempts`);
        clearInterval(checkInterval);
        resolve(false);
      } else {
        console.warn(`Waiting for GPT Engineer script... (attempt ${attempts}/${maxAttempts})`);
        // Ensure the script tag exists on each check
        ensureScriptLoaded();
      }
    }, timeout);
  });
}

// Initialize the application
async function initializeApp() {
  try {
    // Wait for script to be ready
    const scriptReady = await checkGptEngineered();
    if (!scriptReady) {
      showErrorMessage("Failed to load required scripts. Please check your network connection and refresh the page.");
      return;
    }
    
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

// Start initialization process when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeApp());
  } else {
    initializeApp();
  }
}
