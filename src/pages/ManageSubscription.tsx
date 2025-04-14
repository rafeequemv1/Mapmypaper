
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Settings, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient, useUser } from "@/hooks/use-supabase";

const ManageSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/manage-subscription");
      return;
    }

    const checkSubscription = async () => {
      try {
        setCheckingSubscription(true);
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          throw error;
        }
        
        setSubscriptionData(data);
        
        if (!data.subscribed) {
          toast({
            title: "No Active Subscription",
            description: "You don't have an active subscription to manage.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/pricing"), 2000);
        }
      } catch (error: any) {
        console.error("Error checking subscription:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to retrieve subscription information",
          variant: "destructive",
        });
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user, supabase, toast, navigate]);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw error;
      }
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData?.subscribed) {
    return (
      <div className="container max-w-xl mx-auto py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Active Subscription</h1>
          <p className="text-muted-foreground mb-8">You don't have an active subscription to manage.</p>
          <Button onClick={() => navigate("/pricing")}>View Pricing Plans</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container max-w-xl mx-auto py-16">
      <Button 
        variant="ghost" 
        className="mb-8" 
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Manage Your Subscription</CardTitle>
          <CardDescription>
            View and manage your current subscription details
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Plan</h3>
            <p className="text-lg font-medium">{subscriptionData?.subscription_tier || "Premium"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p>Active</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Renewal Date</h3>
            <p>{formatDate(subscriptionData?.subscription_end)}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            disabled={loading}
            onClick={handleManageSubscription}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payment Method
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={loading}
            onClick={handleManageSubscription}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Manage Subscription
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ManageSubscription;
