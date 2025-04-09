import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { retrievePDF } from "@/utils/pdfStorage";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVisualizerModal } from "@/hooks/use-visualizer-modal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { extractImagesFromPdf, extractImagesSimple } from "@/utils/pdfImageExtractor";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
});

const VisualizerModal = () => {
  const { isVisualizerModalOpen, visualizationType, imageData, closeVisualizerModal } = useVisualizerModal();
  const [isLoading, setIsLoading] = useState(false);
  const [diagramId] = useState(`diagram-${Math.random().toString(36).substring(2, 11)}`);
  const [diagramDefinition, setDiagramDefinition] = useState("");
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isVisualizerModalOpen) {
      // Reset state when modal closes
      setDiagramDefinition("");
      setExtractedImages([]);
      setCurrentImageIndex(0);
      setIsLoading(false);
    } else if (isVisualizerModalOpen) {
      if (visualizationType === 'images' && imageData) {
        // If images are provided directly, use them
        setExtractedImages(imageData);
        setIsLoading(false);
      } else if (visualizationType === 'images') {
        // Extract images from PDF
        handleImageExtraction();
      } else {
        // Generate other diagram types
        generateDiagram();
      }
    }
  }, [isVisualizerModalOpen, visualizationType, imageData]);

  useEffect(() => {
    if (diagramDefinition && containerRef.current && visualizationType !== 'images') {
      try {
        mermaid.render(diagramId, diagramDefinition)
          .then(({ svg }) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
            }
          })
          .catch(error => {
            console.error("Error rendering diagram:", error);
            toast({
              title: "Visualization Error",
              description: "Failed to generate the diagram. Please try again.",
              variant: "destructive",
            });
          });
      } catch (error) {
        console.error("Error rendering diagram:", error);
        toast({
          title: "Visualization Error",
          description: "Failed to generate the diagram. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [diagramDefinition, diagramId, toast, visualizationType]);

  const handleImageExtraction = async () => {
    setIsLoading(true);
    try {
      // Get PDF text content
      const pdfData = await retrievePDF();
      
      if (!pdfData) {
        toast({
          title: "No PDF Data",
          description: "Please upload a PDF document first",
          variant: "destructive",
        });
        closeVisualizerModal();
        setIsLoading(false);
        return;
      }
      
      // First try with the complex extractor
      let images = await extractImagesFromPdf(pdfData);
      
      // If that doesn't work, try the simple method
      if (images.length === 0) {
        console.log("Trying alternative image extraction method");
        images = await extractImagesSimple(pdfData);
      }
      
      if (images.length === 0) {
        toast({
          title: "No Images Found",
          description: "No images could be extracted from this PDF",
          variant: "warning",
        });
      } else {
        toast({
          title: "Images Extracted",
          description: `Found ${images.length} images in the PDF`,
        });
      }
      
      setExtractedImages(images);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error("Error extracting images:", error);
      toast({
        title: "Extraction Error",
        description: "Failed to extract images from the PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDiagram = async () => {
    setIsLoading(true);
    try {
      // Get PDF text content
      const pdfData = await retrievePDF();
      
      if (!pdfData) {
        toast({
          title: "No PDF Data",
          description: "Please upload a PDF document first",
          variant: "destructive",
        });
        closeVisualizerModal();
        setIsLoading(false);
        return;
      }
      
      // Generate a simple diagram based on the type
      let definition = "";
      
      switch (visualizationType) {
        case "flowchart":
          definition = generateFlowchart(pdfData);
          break;
        case "sequence":
          definition = generateSequence(pdfData);
          break;
        case "class":
          definition = generateClassDiagram(pdfData);
          break;
        case "gantt":
          definition = generateGantt(pdfData);
          break;
        case "er":
          definition = generateER(pdfData);
          break;
        case "pie":
          definition = generatePie(pdfData);
          break;
        default:
          definition = generateFlowchart(pdfData);
      }
      
      setDiagramDefinition(definition);
    } catch (error) {
      console.error("Error generating diagram:", error);
      toast({
        title: "Visualization Error",
        description: "Failed to generate the diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Image navigation functions
  const nextImage = () => {
    if (extractedImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === extractedImages.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (extractedImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? extractedImages.length - 1 : prevIndex - 1
      );
    }
  };

  // Function to handle image selection for mind map
  const addImageToMindMap = () => {
    if (extractedImages.length > 0) {
      const imageDataUrl = extractedImages[currentImageIndex];
      
      // Store in session storage for use in mind map
      const storedImages = JSON.parse(sessionStorage.getItem('mindMapImages') || '[]');
      storedImages.push(imageDataUrl);
      sessionStorage.setItem('mindMapImages', JSON.stringify(storedImages));
      
      toast({
        title: "Image Added",
        description: "Image has been added to the mind map library",
      });
      
      closeVisualizerModal();
    }
  };

  // Generate different diagram types based on PDF content
  const generateFlowchart = (pdfText: string) => {
    // Extract main sections from the PDF text
    const sections = extractSections(pdfText);
    
    let flowchart = `flowchart TD\n`;
    flowchart += `    start[Research Paper] --> intro[Introduction]\n`;
    
    // Add sections to flowchart
    for (let i = 0; i < Math.min(sections.length, 5); i++) {
      const nodeId = `section${i}`;
      const sectionName = sections[i].substring(0, 30) + (sections[i].length > 30 ? "..." : "");
      
      if (i === 0) {
        flowchart += `    intro --> ${nodeId}["${sectionName}"]\n`;
      } else {
        flowchart += `    section${i-1} --> ${nodeId}["${sectionName}"]\n`;
      }
    }
    
    flowchart += `    section${Math.min(sections.length, 5) - 1} --> conclusion[Conclusion]\n`;
    
    return flowchart;
  };

  const generateSequence = (pdfText: string) => {
    // Extract potential actors from the PDF
    const actors = extractActors(pdfText);
    
    let sequence = `sequenceDiagram\n`;
    
    // Add actors 
    actors.forEach(actor => {
      sequence += `    participant ${actor.replace(/\s+/g, '')}\n`;
    });
    
    // Add some sequence steps
    for (let i = 0; i < actors.length - 1; i++) {
      sequence += `    ${actors[i].replace(/\s+/g, '')}->>${actors[i+1].replace(/\s+/g, '')}: Provides data\n`;
      sequence += `    ${actors[i+1].replace(/\s+/g, '')}-->${actors[i].replace(/\s+/g, '')}: Sends feedback\n`;
    }
    
    return sequence;
  };

  const generateClassDiagram = (pdfText: string) => {
    // Extract potential classes from the PDF
    const concepts = extractConcepts(pdfText);
    
    let classDiagram = `classDiagram\n`;
    
    // Add classes
    concepts.forEach(concept => {
      classDiagram += `    class ${concept.replace(/\s+/g, '')} {\n`;
      classDiagram += `      +String id\n`;
      classDiagram += `      +String name\n`;
      classDiagram += `      +method()\n`;
      classDiagram += `    }\n`;
    });
    
    // Add relationships
    for (let i = 0; i < concepts.length - 1; i++) {
      classDiagram += `    ${concepts[i].replace(/\s+/g, '')} <|-- ${concepts[i+1].replace(/\s+/g, '')}\n`;
    }
    
    return classDiagram;
  };

  const generateGantt = (pdfText: string) => {
    // Create a simple Gantt chart
    const sections = extractSections(pdfText);
    
    let gantt = `gantt\n`;
    gantt += `    title Research Timeline\n`;
    gantt += `    dateFormat  YYYY-MM-DD\n`;
    gantt += `    section Research Phases\n`;
    
    let startDate = new Date();
    
    // Add tasks representing research phases
    for (let i = 0; i < Math.min(sections.length, 5); i++) {
      const taskName = sections[i].substring(0, 30) + (sections[i].length > 30 ? "..." : "");
      const start = new Date(startDate);
      startDate.setDate(startDate.getDate() + 30); // Each phase takes 30 days
      const end = new Date(startDate);
      
      gantt += `    ${taskName} :${formatDate(start)}, ${formatDate(end)}\n`;
    }
    
    return gantt;
  };

  const generateER = (pdfText: string) => {
    // Extract potential entities from the PDF
    const entities = extractConcepts(pdfText);
    
    let er = `erDiagram\n`;
    
    // Add entities and relationships
    for (let i = 0; i < Math.min(entities.length, 5); i++) {
      if (i < entities.length - 1) {
        er += `    ${entities[i].replace(/\s+/g, '')} ||--o{ ${entities[i+1].replace(/\s+/g, '')}: contains\n`;
      }
    }
    
    return er;
  };

  const generatePie = (pdfText: string) => {
    // Extract sections and create a pie chart of their relative sizes
    const sections = extractSections(pdfText);
    
    let pie = `pie\n`;
    pie += `    title Distribution of Topics\n`;
    
    // Add sections to pie chart
    for (let i = 0; i < Math.min(sections.length, 5); i++) {
      const sectionName = sections[i].substring(0, 20) + (sections[i].length > 20 ? "..." : "");
      const value = Math.floor(Math.random() * 30) + 10; // Random value between 10 and 40
      
      pie += `    "${sectionName}" : ${value}\n`;
    }
    
    return pie;
  };

  // Helper functions to extract information from PDF text
  const extractSections = (pdfText: string): string[] => {
    // Simple extraction of section-like text chunks
    const sections: string[] = [];
    const lines = pdfText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Look for potential section headers
      if (
        trimmedLine && 
        trimmedLine.length < 100 && 
        trimmedLine.length > 3 && 
        !trimmedLine.endsWith('.') &&
        /^[A-Z0-9]/.test(trimmedLine)
      ) {
        sections.push(trimmedLine);
        if (sections.length >= 10) break;
      }
    }
    
    // If no sections found, create some generic ones
    if (sections.length === 0) {
      return ["Introduction", "Methodology", "Results", "Discussion", "Conclusion"];
    }
    
    return sections;
  };

  const extractActors = (pdfText: string): string[] => {
    // Try to find potential actors in the document
    const defaultActors = ["Researcher", "Subject", "DataAnalyst", "Reviewer", "Editor"];
    
    // Simple entity extraction (looking for capitalized words that might be people)
    const actorRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
    const matches = pdfText.match(actorRegex) || [];
    
    // Filter potential actors
    const potentialActors = [...new Set(matches)]
      .filter(match => match.length > 3)
      .slice(0, 5);
    
    return potentialActors.length > 1 ? potentialActors : defaultActors;
  };

  const extractConcepts = (pdfText: string): string[] => {
    // Try to find potential concepts/classes in the document
    const defaultConcepts = ["Research", "Methodology", "Data", "Analysis", "Result"];
    
    // Get the most frequent capitalized terms
    const conceptRegex = /\b([A-Z][a-z]+)\b/g;
    const matches = pdfText.match(conceptRegex) || [];
    
    // Count occurrences and sort by frequency
    const counts: Record<string, number> = {};
    matches.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });
    
    // Get top concepts
    const potentialConcepts = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 5);
    
    return potentialConcepts.length > 1 ? potentialConcepts : defaultConcepts;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Handle dialog close with escape key or outside click
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeVisualizerModal();
    }
  };

  return (
    <Dialog open={isVisualizerModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" onPointerDownOutside={(e) => {
        // Prevent pointer down outside from triggering other elements
        e.preventDefault();
      }}>
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            {visualizationType === 'images' 
              ? 'PDF Images' 
              : `${visualizationType.charAt(0).toUpperCase() + visualizationType.slice(1)} Visualization`}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-4 top-4" 
            onClick={(e) => {
              e.stopPropagation();
              closeVisualizerModal();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 mt-4 bg-gray-50 rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : visualizationType === 'images' ? (
            <div className="h-full w-full flex flex-col items-center justify-center">
              {extractedImages.length > 0 ? (
                <>
                  <div className="flex-1 flex items-center justify-center w-full">
                    <img 
                      src={extractedImages[currentImageIndex]} 
                      alt={`PDF Image ${currentImageIndex + 1}`} 
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-4">
                    <span className="text-sm text-gray-500">
                      Image {currentImageIndex + 1} of {extractedImages.length}
                    </span>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        Next
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          addImageToMindMap();
                        }}
                      >
                        Add to Mind Map
                      </Button>
                    </div>
                  </div>
                  
                  {/* Thumbnails gallery */}
                  <div className="w-full mt-4 flex gap-2 overflow-x-auto py-2">
                    {extractedImages.map((img, index) => (
                      <div 
                        key={index}
                        className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 ${
                          index === currentImageIndex ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">No images found in the PDF</p>
                </div>
              )}
            </div>
          ) : (
            <div ref={containerRef} className="h-full w-full flex items-center justify-center overflow-auto">
              {/* Mermaid diagram will be rendered here */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizerModal;
