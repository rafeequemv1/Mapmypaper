
import React from 'react';
import { Separator } from "@/components/ui/separator";
import PaperLogo from "@/components/PaperLogo";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-card shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PaperLogo size="md" />
            <h1 className="text-xl font-medium text-foreground">mapmypaper</h1>
          </div>
          
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg mb-6">Last updated: April 4, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>
              At MapMyPaper, we respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our service.
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, password)</li>
              <li>User-generated content (uploaded PDFs, generated mind maps)</li>
              <li>Communications with us</li>
              <li>Payment information (when applicable)</li>
            </ul>
            
            <p>We automatically collect certain information when you use our service:</p>
            <ul>
              <li>Usage information (features used, actions taken)</li>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Cookies and similar technologies</li>
            </ul>
            
            <h2>3. How We Use Your Information</h2>
            <p>We use your information for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Protect the security of our services</li>
            </ul>
            
            <h2>4. Data Retention</h2>
            <p>
              We store your information for as long as necessary to provide our services and fulfill the purposes 
              outlined in this Privacy Policy. You can request deletion of your account and associated data at any time.
            </p>
            
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no security system is impenetrable, and we cannot guarantee the absolute security of our systems.
            </p>
            
            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul>
              <li>Access, correct, or delete your personal information</li>
              <li>Object to or restrict processing of your personal information</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            
            <h2>7. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and processed in, countries other than the one in which you reside. 
              We ensure appropriate safeguards are in place to protect your information.
            </p>
            
            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: 
              <a href="mailto:rafeequemavoor@gmail.com" className="text-primary hover:underline ml-1">
                rafeequemavoor@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} MapMyPaper by Scidart Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
