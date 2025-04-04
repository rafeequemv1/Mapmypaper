
import React from 'react';
import { Separator } from "@/components/ui/separator";
import PaperLogo from "@/components/PaperLogo";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg mb-6">Last updated: April 4, 2025</p>
            
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using MapMyPaper, you agree to be bound by these Terms of Service and all applicable laws 
              and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
            
            <h2>2. Description of Service</h2>
            <p>
              MapMyPaper is a tool that transforms academic papers into visual knowledge maps to help researchers, 
              students, and academics process complex information efficiently. Our services include PDF text 
              extraction, mind map generation, AI-powered research assistance, and visualization tools.
            </p>
            
            <h2>3. User Accounts</h2>
            <p>
              To access certain features, you may need to create an account. You are responsible for maintaining 
              the confidentiality of your account information and for all activities under your account. You agree 
              to notify us immediately of any unauthorized use of your account.
            </p>
            
            <h2>4. Intellectual Property</h2>
            <p>
              MapMyPaper and its original content, features, and functionality are owned by Scidart Academy and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
            
            <h2>5. User Content</h2>
            <p>
              When you upload PDFs or other content, you retain ownership of your intellectual property rights. 
              By uploading content, you grant us a worldwide, non-exclusive license to use, store, and process 
              that content for the purpose of providing our services.
            </p>
            
            <h2>6. Acceptable Use</h2>
            <p>You agree not to use MapMyPaper to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Distribute malware or harmful code</li>
              <li>Interfere with or disrupt the service</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
            </ul>
            
            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Scidart Academy and MapMyPaper shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages resulting from your use or 
              inability to use the service.
            </p>
            
            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the service immediately, without prior notice, 
              for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
            
            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms of Service at any time. We will provide notice 
              of any material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
            
            <h2>10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws, without regard to its 
              conflict of law provisions.
            </p>
            
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at: 
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

export default TermsOfService;
