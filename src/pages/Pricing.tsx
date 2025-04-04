
import React from 'react';
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        showBackButton={false}
        additionalLinks={[
          { to: "/about", label: "About" },
          { to: "/contact", label: "Contact" },
        ]}
      />
      
      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-3">
              <span className="beta-tag">Beta</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-foreground/80 max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include full access to our mind map generation and visualization tools.
            </p>
            <div className="mt-2 bg-blue-50 py-2 px-4 rounded-md inline-block">
              <p className="text-sm text-blue-700 font-medium">Free during beta testing period</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Free Plan */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
                <p className="text-foreground/70 text-sm mb-6">Perfect for casual users and students</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-foreground/70">/month</span>
                </div>
                
                <Button className="w-full mb-6" variant="outline">
                  Get Started
                </Button>
                
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Process 2 PDFs per day</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Basic mind map generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Limited AI chat assistant</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>PNG export only</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="bg-card border border-primary/30 rounded-lg shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl">
                Most Popular
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Premium Plan</h3>
                <p className="text-foreground/70 text-sm mb-6">For researchers and professionals</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-bold">$6.99</span>
                  <span className="text-foreground/70">/month</span>
                </div>
                
                <Button className="w-full mb-6">
                  Upgrade Now
                </Button>
                
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span><strong>Unlimited</strong> PDF processing</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Advanced mind map generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Unlimited AI chat assistant</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Multiple export formats (PNG, PDF, SVG)</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority email support</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Flowchart & treemap visualizations</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Collaborative sharing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">How does the free trial work?</h3>
                <p className="text-foreground/70 text-sm">
                  During our beta phase, all users can access the full feature set free of charge. We'll provide advance notice before transitioning to paid plans.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Can I change plans at any time?</h3>
                <p className="text-foreground/70 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll adjust your billing accordingly.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Are my documents secure?</h3>
                <p className="text-foreground/70 text-sm">
                  Absolutely. We take security seriously. Your uploaded PDFs and generated data are encrypted and never shared with third parties. Documents are processed securely and only accessible to your account.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
                <p className="text-foreground/70 text-sm">
                  We accept all major credit cards, debit cards, and digital wallets including Google Pay, Apple Pay, and PayPal.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-foreground/70 mb-4">
                Have more questions? We're happy to help.
              </p>
              <Link to="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;
