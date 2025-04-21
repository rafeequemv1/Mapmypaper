
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MindMap from './pages/MindMap';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from "@/hooks/use-toast";
import UserDashboard from './pages/UserDashboard';
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster";

// Import our PDF API handlers
import { setupPdfApiHandlers } from "@/utils/pdfApiHandlers";

// Initialize PDF API handlers
setupPdfApiHandlers();

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mindmap" element={<MindMap />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/dashboard" element={<UserDashboard />} />
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
