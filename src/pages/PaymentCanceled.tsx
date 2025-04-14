
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-xl mx-auto py-16">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your payment process was canceled. No charges were made to your account.
        </p>
        
        <div className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={() => navigate("/pricing")}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Return to Pricing
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;
