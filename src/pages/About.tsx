
import React from 'react';
import { Separator } from "@/components/ui/separator";
import PaperLogo from "@/components/PaperLogo";
import { Link } from "react-router-dom";
import { ChevronLeft, BookOpen, Brain, Clock, BarChart2, Zap, Users } from "lucide-react";

const About = () => {
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
          <h1 className="text-3xl font-bold mb-8">About MapMyPaper</h1>
          
          <div className="prose prose-neutral max-w-none">
            <h2 className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Our Mission
            </h2>
            <p>
              MapMyPaper was developed by Scidart Academy with a clear mission: to accelerate scientific research and 
              learning by transforming how researchers, academics, and students interact with complex academic content.
            </p>
            
            <h2 className="flex items-center gap-2 mt-8">
              <Brain className="h-6 w-6 text-primary" />
              Why We Built This
            </h2>
            <p>
              As researchers ourselves, we understand the challenges of processing dense academic papers efficiently. 
              Traditional methods of reading research papers can be time-consuming, leading to information overload 
              and difficulty in connecting concepts across multiple sources.
            </p>
            <p>
              We created MapMyPaper to address these pain points by leveraging the power of visual learning and AI 
              assistance to make research papers more accessible, digestible, and interconnected.
            </p>
            
            <h2 className="flex items-center gap-2 mt-8">
              <Zap className="h-6 w-6 text-primary" />
              Accelerating Research
            </h2>
            <p>
              MapMyPaper is designed to dramatically improve research productivity by:
            </p>
            <ul>
              <li>
                <strong>Reducing reading time</strong> - Transform dense text into visual knowledge maps that 
                can be scanned and understood in a fraction of the time
              </li>
              <li>
                <strong>Improving comprehension</strong> - Visualize complex relationships between concepts and 
                see the bigger picture of a paper's structure and arguments
              </li>
              <li>
                <strong>Enhancing retention</strong> - Leverage visual memory to better recall key information 
                from papers you've processed
              </li>
              <li>
                <strong>Connecting ideas</strong> - See connections between different papers and research areas 
                more clearly through visual representation
              </li>
            </ul>
            
            <h2 className="flex items-center gap-2 mt-8">
              <BarChart2 className="h-6 w-6 text-primary" />
              Key Features
            </h2>
            <p>Our platform offers several powerful tools to enhance your research experience:</p>
            <ul>
              <li>
                <strong>Interactive Mind Maps</strong> - Automatically convert papers into intuitive mind maps 
                that capture the key concepts and their relationships
              </li>
              <li>
                <strong>AI Research Assistant</strong> - Get instant answers to questions about the paper without 
                having to scan through pages of text
              </li>
              <li>
                <strong>Summary Generation</strong> - Create concise summaries of papers to quickly grasp the 
                main points
              </li>
              <li>
                <strong>Flowcharts & Process Diagrams</strong> - Visualize methodologies and procedures as 
                step-by-step flowcharts
              </li>
              <li>
                <strong>Tree Maps</strong> - Organize hierarchical information in papers using intuitive tree 
                structures
              </li>
              <li>
                <strong>Export & Share</strong> - Save your visualizations in multiple formats for presentations, 
                notes, or sharing with colleagues
              </li>
            </ul>
            
            <h2 className="flex items-center gap-2 mt-8">
              <Users className="h-6 w-6 text-primary" />
              Who It's For
            </h2>
            <p>MapMyPaper is an invaluable tool for:</p>
            <ul>
              <li>
                <strong>Academic Researchers</strong> - Process more papers in less time, stay on top of your field
              </li>
              <li>
                <strong>PhD Students</strong> - Accelerate literature reviews and dissertation research
              </li>
              <li>
                <strong>Professors</strong> - Quickly understand new research in your field for teaching or 
                collaboration
              </li>
              <li>
                <strong>Research Scientists</strong> - Extract meaningful insights from papers more efficiently
              </li>
              <li>
                <strong>Students</strong> - Learn complex academic content through visual representations
              </li>
              <li>
                <strong>Knowledge Workers</strong> - Process information-heavy documents more effectively
              </li>
            </ul>
            
            <h2 className="flex items-center gap-2 mt-8">
              <Clock className="h-6 w-6 text-primary" />
              Save Time, Accelerate Discovery
            </h2>
            <p>
              In the fast-paced world of research and academia, time is one of your most valuable resources. 
              MapMyPaper helps you reclaim hours spent on reading and processing papers, allowing you to focus 
              on what truly matters: generating insights, making connections, and advancing your research.
            </p>
            <p>
              By transforming how you interact with academic content, we aim to accelerate the pace of discovery 
              and innovation across all fields of research.
            </p>
            
            <h2 className="mt-8">About Scidart Academy</h2>
            <p>
              MapMyPaper is developed by Scidart Academy, a platform dedicated to advancing scientific research 
              and education through innovative tools and technologies. Learn more at 
              <a href="https://scidart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                scidart.com
              </a>.
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

export default About;
