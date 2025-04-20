
import React from "react";

const Refund = () => {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
      <div className="prose max-w-none">
        <p className="text-lg mb-6">
          Last updated: April 20, 2025
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
          <p>
            We offer a 14-day money-back guarantee for our subscription services. If you're not
            satisfied with our service, you can request a refund within 14 days of your initial
            purchase.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
          <p>
            To request a refund, please contact our support team at support@mapmypaper.com
            with your account details and reason for the refund.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Refund;
