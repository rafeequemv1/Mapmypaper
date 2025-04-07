
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Here you could verify the payment with Stripe if needed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        showBackButton={false}
        additionalLinks={[
          { to: "/about", label: "About" },
          { to: "/contact", label: "Contact" },
        ]}
      />
      
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-lg w-full mx-auto px-6">
          <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
            {loading ? (
              <>
                <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-6"></div>
                <h1 className="text-2xl font-bold mb-4">Processing Your Payment</h1>
                <p className="text-foreground/70 mb-4">Please wait while we confirm your payment...</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
                <p className="text-foreground/70 mb-6">
                  Thank you for your purchase. Your account has been upgraded and you now have access to all premium features.
                </p>
                <div className="space-y-4">
                  <Link to="/">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                  <Link to="/mindmap">
                    <Button variant="outline" className="w-full">
                      Create Mind Map
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
