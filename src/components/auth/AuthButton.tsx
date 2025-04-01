
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "./AuthModal";
import { User } from "@supabase/supabase-js";

interface AuthButtonProps {
  user: User | null;
  onAuthChange: () => void;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "icon";
  className?: string;
}

const AuthButton = ({ 
  user, 
  onAuthChange, 
  size = "default", 
  variant = "default",
  className = ""
}: AuthButtonProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You've been signed out of your account."
      });
      onAuthChange();
    }
  };

  const handleAuthClick = () => {
    if (user) {
      handleSignOut();
    } else {
      setAuthModalTab("login");
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleAuthClick}
        className={className}
      >
        {user ? "Sign Out" : "Sign In"}
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          onAuthChange();
        }}
        defaultTab={authModalTab}
      />
    </>
  );
};

export default AuthButton;
