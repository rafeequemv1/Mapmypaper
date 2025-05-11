
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/node-menu.css'; // Import the node-menu styles globally

// Ensure DOM is ready before mounting
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById("root");
  if (!container) {
    console.error('Root element not found');
    return;
  }

  // Safely create root and render
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render React application:', error);
  }
});
