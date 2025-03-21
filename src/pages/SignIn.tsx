
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignInForm from "@/components/auth/SignInForm";
import { Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SignIn = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/mindmap");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="py-4 px-8 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center">
          <a href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-medium">PaperMind</h1>
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
          <SignInForm />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
