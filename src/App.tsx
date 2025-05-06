
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import Footer from "@/components/Footer";
import PdfUpload from "./pages/PdfUpload";
import MindMap from "./pages/MindMap";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import Refund from "./pages/Refund";
import Features from "./pages/Features";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Layout component that includes Footer only (removed TopBar)
const Layout = () => (
  <>
    <div className="pt-4 pb-8">
      <Outlet />
    </div>
    <Footer />
  </>
);

// Layout without TopBar and Footer for the editor
const EditorLayout = () => <Outlet />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="relative">
          <BrowserRouter>
            <Routes>
              {/* Routes with Footer only (removed TopBar) */}
              <Route element={<Layout />}>
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/features" element={<Features />} />
                <Route path="/" element={<PdfUpload />} />
              </Route>
              
              {/* Routes without any wrappers */}
              <Route element={<EditorLayout />}>
                <Route element={<RequireAuth />}>
                  <Route path="/mindmap" element={<MindMap />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
