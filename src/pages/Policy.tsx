
import React from "react";

const Policy = () => {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p className="text-lg mb-6">
          Last updated: April 20, 2025
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including when you:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Create an account</li>
            <li>Upload PDF documents</li>
            <li>Generate mind maps</li>
            <li>Contact our support team</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Provide and improve our services</li>
            <li>Process your payments</li>
            <li>Send you updates and notifications</li>
            <li>Respond to your inquiries</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Policy;
