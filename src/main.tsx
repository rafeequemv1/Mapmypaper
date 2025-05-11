
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Get the root element
const rootElement = document.getElementById("root");

// Safety check to ensure the element exists
if (!rootElement) {
  console.error("Root element not found. Cannot mount React application.");
} else {
  try {
    // Create the root and render the app
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.info("React application mounted successfully");
  } catch (error) {
    console.error("Failed to render React application:", error);
  }
}
