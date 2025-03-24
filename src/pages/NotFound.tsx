
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Brain className="h-12 w-12 text-black" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-black">Page not found</h1>
        <p className="text-xl text-gray-600 mb-6">
          The page you're looking for doesn't exist or you may not have permission to access it.
        </p>
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            If you were trying to generate a mind map, please try again with a different PDF file or check if you're logged in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-black text-white hover:bg-gray-800">
              <Link to="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-black text-black hover:bg-gray-100">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
