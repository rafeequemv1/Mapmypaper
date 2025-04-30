
import React, { useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import mermaid from "mermaid";

interface MermaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidModal: React.FC<MermaidModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });

      // Clear previous renders
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
      }

      // Research paper structure flowchart
      const diagram = `
        graph TD
          title[Research Paper Structure]
          title --> abstract[Abstract]
          title --> intro[Introduction]
          title --> methods[Methodology]
          title --> results[Results]
          title --> discuss[Discussion]
          title --> concl[Conclusion]
          title --> refs[References]
          
          intro --> background[Background & Context]
          intro --> problem[Problem Statement]
          intro --> significance[Research Significance]
          intro --> objectives[Research Objectives]
          
          methods --> design[Research Design]
          methods --> data[Data Collection]
          methods --> analysis[Data Analysis]
          methods --> ethics[Ethical Considerations]
          
          results --> findings[Key Findings]
          results --> tables[Tables & Figures]
          results --> stats[Statistical Analysis]
          
          discuss --> interpret[Interpretation]
          discuss --> compare[Comparison with Literature]
          discuss --> limitations[Limitations]
          discuss --> implications[Implications]
          
          concl --> summary[Summary of Findings]
          concl --> contribution[Contribution to Field]
          concl --> future[Future Research Directions]
          
          classDef highlight fill:#f9f,stroke:#333,stroke-width:2px;
          class title highlight;
      `;

      try {
        mermaid.render("mermaid-diagram", diagram).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        });
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Research Paper Structure</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-white rounded-md overflow-auto max-h-[70vh]">
          <div ref={mermaidRef} className="flex justify-center" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidModal;
