
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useSupabaseClient, useUser } from "@/hooks/use-supabase";

const PricingPage = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanSelection = async (planName: string, planPrice: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to continue with the subscription",
        variant: "destructive",
      });
      navigate("/auth?redirect=/pricing");
      return;
    }

    setLoading(planName);

    try {
      // Call our Supabase Edge Function to create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: planName,
          price: planPrice,
        },
      });

      if (error) {
        throw error;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to initiate checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container max-w-6xl py-12 mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your needs. Unlock premium features with our subscription plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Basic Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>Essential features for beginners</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Limited mind maps</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Basic PDF analysis</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Export as PNG</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Community support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/mindmap")}
              >
                Get Started <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="flex flex-col h-full border-primary">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <div className="py-1 px-3 bg-primary text-primary-foreground rounded-full text-xs font-medium w-fit mb-2">
                POPULAR
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>Advanced features for professionals</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Unlimited mind maps</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Advanced PDF analysis</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Export in multiple formats</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Auto-save & sync</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>AI-powered summaries</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={loading === "pro"}
                onClick={() => handlePlanSelection("pro", "price_monthly_pro")}
              >
                {loading === "pro" ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Enterprise Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription>Complete solution for teams</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$24.99</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>On-demand AI training</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="secondary"
                disabled={loading === "enterprise"}
                onClick={() => handlePlanSelection("enterprise", "price_monthly_enterprise")}
              >
                {loading === "enterprise" ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div>
            <h3 className="font-medium text-lg">Can I cancel my subscription anytime?</h3>
            <p className="text-muted-foreground mt-1">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
          </div>
          <div>
            <h3 className="font-medium text-lg">Is my payment secure?</h3>
            <p className="text-muted-foreground mt-1">Absolutely. We use Stripe for payment processing, ensuring your data is secure with industry-standard encryption.</p>
          </div>
          <div>
            <h3 className="font-medium text-lg">Can I change plans later?</h3>
            <p className="text-muted-foreground mt-1">Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
