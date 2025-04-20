
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <div className="max-w-2xl">
        <p className="text-lg mb-6">
          Have questions or need assistance? We're here to help! Reach out to our team
          and we'll get back to you as soon as possible.
        </p>
        <div className="space-y-4">
          <a
            href="mailto:support@mapmypaper.com"
            className="inline-flex"
          >
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
