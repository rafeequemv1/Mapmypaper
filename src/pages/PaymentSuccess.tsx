
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient } from "@/hooks/use-supabase";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    // Verify the payment with Supabase edge function
    const verifyPayment = async () => {
      try {
        setRefreshing(true);

        // Get the session_id from URL if available
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        
        // Call the check-subscription edge function to update status
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          throw error;
        }
        
        console.log("Subscription check result:", data);
        
        if (data.subscribed) {
          toast({
            title: "Subscription Active",
            description: "Your subscription is now active. Enjoy your premium features!",
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Error",
          description: "There was an issue verifying your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setRefreshing(false);
      }
    };

    verifyPayment();
  }, [supabase, toast]);

  return (
    <div className="container max-w-xl mx-auto py-16">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your subscription. Your account has been upgraded and all premium features are now available.
        </p>
        
        <div className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={() => navigate("/mindmap")}
          >
            Go to Mind Maps <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
