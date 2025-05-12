
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Make sure the DOM is fully loaded before attempting to render
document.addEventListener('DOMContentLoaded', () => {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("Root element not found!");
      return;
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
  }
});
