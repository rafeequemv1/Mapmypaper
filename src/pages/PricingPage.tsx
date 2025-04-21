
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const PricingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Pricing Plans</h1>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
          {/* Free Plan */}
          <div className="border rounded-lg p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-2 mb-6 flex-1">
              <li>• 3 Mind Maps</li>
              <li>• Basic PDF Analysis</li>
              <li>• Core Features</li>
            </ul>
            <Button asChild className="w-full">
              <Link to="/mindmap">Get Started</Link>
            </Button>
          </div>
          
          {/* Pro Plan */}
          <div className="border rounded-lg p-6 flex flex-col relative bg-muted/50">
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-full">
              Popular
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <p className="text-3xl font-bold mb-4">$9<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-2 mb-6 flex-1">
              <li>• Unlimited Mind Maps</li>
              <li>• Advanced PDF Analysis</li>
              <li>• Export as PNG/PDF</li>
              <li>• Chat with PDF</li>
            </ul>
            <Button asChild className="w-full">
              <Link to="/mindmap">Upgrade Now</Link>
            </Button>
          </div>
          
          {/* Business Plan */}
          <div className="border rounded-lg p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Business</h2>
            <p className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-2 mb-6 flex-1">
              <li>• Everything in Pro</li>
              <li>• Team Collaboration</li>
              <li>• API Access</li>
              <li>• Priority Support</li>
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link to="/mindmap">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
