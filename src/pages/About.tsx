
import React from "react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        additionalLinks={[
          { to: "/pricing", label: "Pricing" },
          { to: "/contact", label: "Contact" },
        ]}
      />
      
      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8">About MapMyPaper</h1>
          
          <div className="bg-card rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="text-foreground/80 mb-4">
              At MapMyPaper, our mission is to transform how researchers, academics, and students interact with 
              scientific literature. We believe that visual learning can dramatically improve comprehension, 
              retention, and the ability to make connections between complex concepts.
            </p>
            <p className="text-foreground/80 mb-4">
              By converting dense academic text into interactive visual knowledge maps, we help you:
            </p>
            <ul className="list-disc pl-6 mb-6 text-foreground/80 space-y-2">
              <li>Extract key concepts and relationships from papers more efficiently</li>
              <li>Understand complex methodologies through visual representations</li>
              <li>Accelerate your research process by reducing reading time</li>
              <li>Improve knowledge retention through multi-modal learning</li>
              <li>Discover connections between concepts that might be missed in linear reading</li>
            </ul>
            <p className="text-foreground/80">
              Our goal is to make scientific literature more accessible and to help researchers work 
              more efficiently, allowing you to focus on generating insights rather than getting bogged 
              down in information processing.
            </p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">About Scidart Academy</h2>
            <p className="text-foreground/80 mb-4">
              MapMyPaper is developed by Scidart Academy, an organization dedicated to advancing scientific 
              research and education through innovative tools and technologies.
            </p>
            <p className="text-foreground/80 mb-4">
              Founded by researchers for researchers, Scidart Academy understands the challenges that 
              academics face when dealing with the ever-growing volume of scientific literature. Our team 
              combines expertise in artificial intelligence, education technology, and academic research 
              to create tools that make the research process more efficient and effective.
            </p>
            <p className="text-foreground/80 mb-4">
              At Scidart Academy, we believe that technology should augment human intelligence, not replace it. 
              Our tools are designed to help researchers process information more quickly and effectively, 
              allowing them to spend more time on creative thinking, analysis, and discovery.
            </p>
            <div className="flex justify-center mt-6">
              <a 
                href="https://scidart.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded transition-colors"
              >
                Visit Scidart Academy
              </a>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">Our Technology</h2>
            <p className="text-foreground/80 mb-4">
              MapMyPaper uses advanced natural language processing and machine learning techniques to analyze 
              academic papers and extract key concepts, relationships, methodologies, and findings.
            </p>
            <p className="text-foreground/80 mb-4">
              Our platform generates multiple visualizations that help you understand papers from different perspectives:
            </p>
            <ul className="list-disc pl-6 mb-6 text-foreground/80 space-y-2">
              <li><strong>Mind Maps</strong>: Visualize the hierarchical structure and relationships between concepts</li>
              <li><strong>Flowcharts</strong>: Understand methodologies and processes through step-by-step visualizations</li>
              <li><strong>Treemaps</strong>: See the relative importance and distribution of topics within a paper</li>
              <li><strong>Interactive AI Chat</strong>: Discuss and ask questions about the paper with our AI research assistant</li>
            </ul>
            <p className="text-foreground/80 mb-6">
              We prioritize security and privacy in all aspects of our platform. Your documents are processed 
              securely, and we use encryption to protect your data. We do not share your documents with third 
              parties, and you retain full ownership of your content at all times.
            </p>
            
            <div className="flex justify-center">
              <Link to="/">
                <Button className="mr-4">
                  Try MapMyPaper Now
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="flex items-center gap-2">
                  View Pricing <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;
