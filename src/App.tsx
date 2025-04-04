
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import PdfUpload from "./pages/PdfUpload";
import MindMap from "./pages/MindMap";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { VisualizerModalProvider } from "./contexts/VisualizerModalContext";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <VisualizerModalProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="relative">
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<PdfUpload />} />
                
                {/* Protected routes */}
                <Route element={<RequireAuth />}>
                  <Route path="/mindmap" element={<MindMap />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </VisualizerModalProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
