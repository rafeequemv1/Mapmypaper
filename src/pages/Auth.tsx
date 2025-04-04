import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaperLogo } from "@/components/PaperLogo";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"sign_in" | "sign_up">("sign_in");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (type === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email: email,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Signed up successfully! Please check your email to verify your account.",
        });
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we were in the middle of processing a PDF
    const pendingPdfProcessing = sessionStorage.getItem('pendingPdfProcessing');
    
    // If user is authenticated and we have a pending PDF processing
    if (user && pendingPdfProcessing === 'true') {
      // Clear the flag
      sessionStorage.removeItem('pendingPdfProcessing');
      
      // Show toast notification to continue
      toast({
        title: "Continue to Mind Map",
        description: "Now you can generate your mind map!",
      });
      
      // Redirect back to home to continue PDF processing
      navigate("/");
    }
  }, [user, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PaperLogo size="md" />
            <h1 className="text-xl font-medium text-[#333]">mapmypaper</h1>
          </div>
          <div></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-6">
            <PaperLogo size="lg" />
            <h1 className="text-2xl font-bold text-[#333]">{type === "sign_in" ? "Sign In" : "Create Account"}</h1>
            <p className="text-gray-600 mt-2">
              {type === "sign_in"
                ? "Sign in to access your account"
                : "Create an account to start mapping your papers"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#333] hover:bg-[#444] text-white"
              disabled={loading}
              size="lg"
            >
              {loading ? "Loading..." : type === "sign_in" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setType(type === "sign_in" ? "sign_up" : "sign_in")}
              disabled={loading}
            >
              {type === "sign_in"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PaperLogo size="sm" />
                <h2 className="text-lg font-medium text-[#333]">mapmypaper</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Transform research papers into interactive mind maps for better comprehension and retention.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/auth" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Sign In
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MapMyPaper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
