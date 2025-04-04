
import React from 'react';
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        additionalLinks={[
          { to: "/about", label: "About" },
          { to: "/pricing", label: "Pricing" },
          { to: "/contact", label: "Contact" },
        ]}
      />
      
      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="bg-card rounded-lg shadow-sm p-8 prose max-w-none">
            <p className="text-sm text-muted-foreground mb-6">Last updated: April 1, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>
              Welcome to MapMyPaper ("we", "our", or "us"). By accessing or using our website, you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, you may not access our service.
            </p>
            
            <h2>2. Beta Service</h2>
            <p>
              MapMyPaper is currently in beta. During this period, the service is provided "as is" and may contain errors or inaccuracies. 
              We may make significant changes to the service during this period, including changes to pricing, features, or availability.
            </p>
            
            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining 
              the security of your account and password. We cannot and will not be liable for any loss or damage from your failure to comply 
              with this security obligation.
            </p>
            
            <h2>4. Intellectual Property</h2>
            <h3>4.1 Your Content</h3>
            <p>
              You retain all rights to the PDFs you upload to our service. By uploading content to MapMyPaper, you grant us a worldwide, 
              non-exclusive, royalty-free license to use, reproduce, and process your content solely for the purpose of providing our services to you.
            </p>
            
            <h3>4.2 Our Content</h3>
            <p>
              The MapMyPaper service, including all of its features, functionality, software, design, and content (excluding Your Content), 
              is owned by us and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <h2>5. Data Security</h2>
            <p>
              We take the security of your documents seriously. We implement appropriate technical and organizational measures to ensure a level 
              of security appropriate to the risk. Your documents are stored securely and are not shared with third parties except as necessary 
              to provide our services.
            </p>
            
            <h2>6. Acceptable Use</h2>
            <p>
              You may not use our service for any illegal or unauthorized purpose. You must not, in the use of the service, violate any laws in your jurisdiction.
            </p>
            
            <h2>7. Pricing and Payment</h2>
            <p>
              During the beta period, MapMyPaper is free to use with limitations as described on our pricing page. Once we exit beta, 
              pricing for our service will be as described on our pricing page. We reserve the right to change our pricing at any time.
            </p>
            
            <h2>8. Limitation of Liability</h2>
            <p>
              In no event shall MapMyPaper, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
              incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or 
              other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
            
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without 
              limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
            </p>
            
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to 
              provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: rafeequemavoor@gmail.com</li>
              <li>Phone: +91 94472 67129</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
