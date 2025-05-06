
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileImage, FilePdf, ChartPie, Download } from "lucide-react";
import { Link } from "react-router-dom";

const Features = () => {
  const features = [
    {
      title: "Multi-PDF Analysis",
      description: "Analyze multiple documents simultaneously to extract insights, compare information, and find connections across your entire document collection.",
      icon: <FilePdf className="h-12 w-12 text-primary" />,
      action: "Analyze PDFs"
    },
    {
      title: "Smart Text Explanation",
      description: "Highlight any text to get instant explanations, definitions, and deeper context without leaving your document.",
      icon: <FileText className="h-12 w-12 text-primary" />,
      action: "Try Explanations"
    },
    {
      title: "Image Screenshot",
      description: "Capture and annotate important visual information directly from your documents with our intuitive screenshot tool.",
      icon: <FileImage className="h-12 w-12 text-primary" />,
      action: "Capture Images"
    },
    {
      title: "Visual Knowledge Maps",
      description: "Transform your documents into interactive flowcharts, mind maps, and tree maps to visualize complex information and relationships.",
      icon: <ChartPie className="h-12 w-12 text-primary" />,
      action: "Create Maps"
    },
    {
      title: "Instant Summary",
      description: "Generate concise summaries of lengthy documents with one click to quickly grasp the key points and main ideas.",
      icon: <FileText className="h-12 w-12 text-primary" />,
      action: "Get Summaries"
    },
    {
      title: "File Downloads",
      description: "Easily download your enhanced documents, annotations, summaries, and visual maps in multiple formats for sharing and reference.",
      icon: <Download className="h-12 w-12 text-primary" />,
      action: "Download Files"
    }
  ];

  return (
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Powerful Document Analysis Features</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform how you interact with documents using our comprehensive suite of intelligent tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-2">
            <CardHeader>
              <div className="mb-4 flex items-center justify-center">{feature.icon}</div>
              <CardTitle className="text-2xl text-center">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/">{feature.action}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-16">
        <Button asChild size="lg" variant="outline">
          <Link to="/">Start Analyzing Now</Link>
        </Button>
      </div>
    </div>
  );
};

export default Features;
