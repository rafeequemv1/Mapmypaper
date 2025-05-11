
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Ensure DOM is ready before mounting
document.addEventListener('DOMContentLoaded', () => {
  try {
    const container = document.getElementById("root");
    
    if (!container) {
      console.error('Root element not found');
      return;
    }

    // Create root using the createRoot API
    const root = ReactDOM.createRoot(container);
    
    // Render the app with error boundary
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("React application mounted successfully");
  } catch (error) {
    console.error('Failed to render React application:', error);
    
    // Try to render an error message if the main app fails
    try {
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.style.margin = '20px';
      errorContainer.style.border = '1px solid red';
      errorContainer.innerHTML = '<h2>Application Error</h2><p>The application failed to load. Please try refreshing the page.</p>';
      
      document.body.appendChild(errorContainer);
    } catch (fallbackError) {
      // Last resort error handling
      console.error('Even error display failed:', fallbackError);
    }
  }
});
