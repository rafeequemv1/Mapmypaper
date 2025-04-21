
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Mind Mapper</h1>
        <p className="text-lg mb-8 max-w-2xl">
          Create interactive mind maps from your PDFs. Visualize information, organize your thoughts, and enhance your learning.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link to="/mindmap">Create Mind Map</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
