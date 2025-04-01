
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfUpload from "./pages/PdfUpload";
import MindMap from "./pages/MindMap";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading, refreshSession } = useAuth();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PdfUpload user={user} onAuthChange={refreshSession} />} />
        <Route path="/mindmap" element={<MindMap />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="relative flex flex-col min-h-screen">
        <div className="flex-1">
          <AppRoutes />
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
