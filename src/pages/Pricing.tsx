
import React from 'react';
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";

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
            <PricingCard
              title="Free Plan"
              description="Perfect for casual users and students"
              price="$0"
              priceId=""
              isFree={true}
              buttonText="Get Started"
              features={[
                { text: "Process 2 PDFs per day", included: true },
                { text: "Basic mind map generation", included: true },
                { text: "Limited AI chat assistant", included: true },
                { text: "PNG export only", included: true },
                { text: "Community support", included: true },
                { text: "Advanced features", included: false },
                { text: "Multiple visualizations", included: false },
              ]}
            />
            
            {/* Premium Plan */}
            <PricingCard
              title="Premium Plan"
              description="For researchers and professionals"
              price="$6.99"
              priceId="price_1NnypzSJVa5DWIui3KPxEDk6"
              popular={true}
              buttonText="Upgrade Now"
              features={[
                { text: "Unlimited PDF processing", included: true },
                { text: "Advanced mind map generation", included: true },
                { text: "Unlimited AI chat assistant", included: true },
                { text: "Multiple export formats (PNG, PDF, SVG)", included: true },
                { text: "Priority email support", included: true },
                { text: "Flowchart & treemap visualizations", included: true },
                { text: "Collaborative sharing", included: true },
              ]}
            />
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
                  We accept all major credit cards, debit cards, and digital wallets including Google Pay, Apple Pay, and PayPal through our secure Stripe payment system.
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
