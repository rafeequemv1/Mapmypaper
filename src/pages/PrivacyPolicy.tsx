
import React from 'react';
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="bg-card rounded-lg shadow-sm p-8 prose max-w-none">
            <p className="text-sm text-muted-foreground mb-6">Last updated: April 1, 2025</p>
            
            <h2>Introduction</h2>
            <p>
              At MapMyPaper ("we", "our", or "us"), we respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website and 
              use our services, and tell you about your privacy rights and how the law protects you.
            </p>
            
            <h2>The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you including:
            </p>
            <ul>
              <li><strong>Identity Data</strong>: includes first name, last name, username or similar identifier</li>
              <li><strong>Contact Data</strong>: includes email address</li>
              <li><strong>Technical Data</strong>: includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform</li>
              <li><strong>Usage Data</strong>: includes information about how you use our website and services</li>
              <li><strong>Content Data</strong>: includes the PDFs you upload for processing, and the resulting mind maps and visualizations</li>
            </ul>
            
            <h2>How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul>
              <li>To register you as a new customer</li>
              <li>To provide and improve our services</li>
              <li>To manage your relationship with us</li>
              <li>To administer and protect our business and website</li>
              <li>To deliver relevant website content and advertisements to you</li>
            </ul>
            
            <h2>Document Security</h2>
            <p>
              We take the security of your documents very seriously. When you upload a PDF to MapMyPaper:
            </p>
            <ul>
              <li>Your documents are processed securely in our infrastructure</li>
              <li>Documents are stored with encryption at rest</li>
              <li>We do not share your documents with third parties except as necessary to provide our services</li>
              <li>We use secure transmission protocols for all data transfers</li>
              <li>You retain ownership of your content at all times</li>
            </ul>
            
            <h2>Data Retention</h2>
            <p>
              We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for. 
              By default, we retain your uploaded PDFs and generated visualizations for as long as your account is active. 
              You can delete your data at any time through your account settings.
            </p>
            
            <h2>Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:
            </p>
            <ul>
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
            
            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and store certain information. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
            
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
              and updating the "Last updated" date at the top of this page.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
