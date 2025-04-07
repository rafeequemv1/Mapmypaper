
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession, getStripe } from "@/services/stripeService";
import { useNavigate } from "react-router-dom";

interface Feature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: Feature[];
  priceId: string;
  popular?: boolean;
  buttonText: string;
  isFree?: boolean;
  interval?: string;
}

const PricingCard = ({
  title,
  price,
  description,
  features,
  priceId,
  popular = false,
  buttonText,
  isFree = false,
  interval = "month"
}: PricingCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (isFree) {
      navigate("/");
      return;
    }

    try {
      toast({
        title: "Processing",
        description: "Preparing your checkout session...",
      });

      const { url } = await createCheckoutSession(
        priceId, 
        interval === "one-time" ? "payment" : "subscription"
      );
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={`bg-card border ${popular ? 'border-primary/30' : 'border-border'} rounded-lg shadow-sm overflow-hidden relative`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl">
          Most Popular
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-foreground/70 text-sm mb-6">{description}</p>
        
        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          {!isFree && interval !== "one-time" && (
            <span className="text-foreground/70">/{interval}</span>
          )}
        </div>
        
        <Button 
          className="w-full mb-6" 
          variant={isFree ? "outline" : "default"}
          onClick={handleSubscribe}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className={`h-4 w-4 ${feature.included ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={feature.included ? '' : 'text-gray-400'}>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PricingCard;
