
import React from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

const Pricing = () => {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h1>
      <div className="max-w-md mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col p-6 space-y-2">
            <h3 className="font-semibold tracking-tight text-2xl">Pro Plan</h3>
            <p className="text-sm text-muted-foreground">
              Everything you need for academic research visualization
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-baseline text-3xl font-bold">
              $7.99
              <span className="ml-1 text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center">✓ Unlimited PDF uploads</li>
              <li className="flex items-center">✓ Advanced mind mapping tools</li>
              <li className="flex items-center">✓ Export in multiple formats</li>
              <li className="flex items-center">✓ Priority support</li>
            </ul>
            <Button className="w-full mt-6 gap-2">
              <DollarSign className="h-4 w-4" />
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
