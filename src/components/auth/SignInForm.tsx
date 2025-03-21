import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const SignInForm = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Signed in successfully",
        description: "Welcome to MapMyPaper!",
      });
      
      navigate("/mindmap");
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setOauthError(null);
      setIsGoogleLoading(true);
      
      console.log("Starting Google sign-in process");
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error("Google sign-in error (returned):", error);
        setOauthError(error?.message || "Failed to connect to Google. Please check your network and try again.");
        
        toast({
          title: "Sign in with Google failed",
          description: error?.message || "An error occurred. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Google sign-in process initiated successfully");
      // We don't navigate here as OAuth will handle the redirect
    } catch (error: any) {
      console.error("Google sign-in error (caught):", error);
      setOauthError(error?.message || "Failed to connect to Google. Please check your network and try again.");
      
      toast({
        title: "Sign in with Google failed",
        description: error?.message || "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      // We keep the loading state until redirect happens or until error occurs
      if (oauthError) {
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-500">Welcome back to MapMyPaper</p>
      </div>
      
      {oauthError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">OAuth Error</p>
            <p className="text-sm">{oauthError}</p>
            <p className="text-sm mt-1">
              Please check that pop-ups aren't blocked, your network connection is stable, and that 
              the Google OAuth is properly configured in your Supabase project.
            </p>
          </div>
        </div>
      )}
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center gap-2"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v3.2h5.59c-0.8,2.4-3.06,4.1-5.59,4.1c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.39,0,2.78,0.47,3.93,1.67 l2.3-2.3C16.32,3.87,14.18,3,12,3C7.03,3,3,7.03,3,12s4.03,9,9,9s9-4.03,9-9C21,11.64,20.92,11.36,21.35,11.1z" fill="#4285F4"></path>
            </g>
          </svg>
        )}
        {isGoogleLoading ? "Connecting..." : "Sign in with Google"}
      </Button>
      
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-sm">OR</span>
        <Separator className="flex-1" />
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In with Email"}
          </Button>
        </form>
      </Form>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
