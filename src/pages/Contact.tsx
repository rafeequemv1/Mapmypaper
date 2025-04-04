
import React from 'react';
import { Link } from "react-router-dom";
import { Mail, Phone, Linkedin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        additionalLinks={[
          { to: "/about", label: "About" },
          { to: "/pricing", label: "Pricing" },
        ]}
      />
      
      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
          
          <div className="bg-card rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Get in Touch</h2>
            <p className="text-foreground mb-6">
              Have questions about MapMyPaper? Need assistance with your account or have suggestions for improvement? 
              We'd love to hear from you. Reach out using any of the contact methods below.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-secondary w-12 h-12 rounded-full flex items-center justify-center">
                  <Mail className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <a href="mailto:rafeequemavoor@gmail.com" className="text-primary hover:underline">
                    rafeequemavoor@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-secondary w-12 h-12 rounded-full flex items-center justify-center">
                  <Phone className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <a href="tel:+919447267129" className="text-primary hover:underline">
                    +91 94472 67129
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-secondary w-12 h-12 rounded-full flex items-center justify-center">
                  <Linkedin className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">LinkedIn</h3>
                  <a 
                    href="https://www.linkedin.com/in/rafeequemavoor" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    linkedin.com/in/rafeequemavoor
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">About Scidart Academy</h2>
            <p className="text-foreground mb-4">
              MapMyPaper is developed by Scidart Academy, a platform dedicated to advancing scientific research and 
              education through innovative tools and technologies.
            </p>
            <p className="text-foreground mb-4">
              Visit our main website to learn more about our other projects and initiatives:
            </p>
            <a 
              href="https://scidart.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 transition-colors"
            >
              Visit Scidart.com
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
