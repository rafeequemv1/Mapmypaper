
import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { getAllPdfs } from "@/components/PdfTabs";

// Default mindmap diagram with enhanced colors and branch-based structure
export const defaultMindmap = `mindmap
  root((Paper Topic))
  class root rootStyle
  
  root --> summary["Summary"]
  class summary summaryClass
  
  summary --> keyPoints["Key Points"]
  class keyPoints summaryDetailClass
  
  summary --> mainContrib["Main Contributions"]
  class mainContrib summaryDetailClass
  
  summary --> significance["Significance"]
  class significance summaryDetailClass
  
  root --> concept1["Key Concept 1"]
  class concept1 branch1Class
  
  concept1 --> sub11["Sub-concept 1.1"]
  class sub11 subbranch1Class
  
  sub11 --> det111["Detail 1.1.1"]
  class det111 detail1Class
  
  sub11 --> det112["Detail 1.1.2"]
  class det112 detail1Class
  
  concept1 --> sub12["Sub-concept 1.2"]
  class sub12 subbranch1Class
  
  sub12 --> det121["Detail 1.2.1"]
  class det121 detail1Class
  
  root --> concept2["Key Concept 2"]
  class concept2 branch2Class
  
  concept2 --> sub21["Sub-concept 2.1"]
  class sub21 subbranch2Class
  
  sub21 --> det211["Detail 2.1.1"]
  class det211 detail2Class
  
  sub21 --> det212["Detail 2.1.2"]
  class det212 detail2Class
  
  concept2 --> sub22["Sub-concept 2.2"]
  class sub22 subbranch2Class
  
  root --> concept3["Key Concept 3"]
  class concept3 branch3Class
  
  concept3 --> sub31["Sub-concept 3.1"]
  class sub31 subbranch3Class
  
  sub31 --> det311["Detail 3.1.1"]
  class det311 detail3Class
  
  sub31 --> det312["Detail 3.1.2"]
  class det312 detail3Class
  
  det312 --> subdet3121["Sub-detail 3.1.2.1"]
  class subdet3121 subdetail3Class

%% Color styling for different branches
%% classDef rootStyle fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px
%% classDef summaryClass fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold
%% classDef summaryDetailClass fill:#333333,color:#ffffff,stroke:#000000,font-style:italic
%% classDef branch1Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef branch2Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef branch3Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef subbranch1Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef subbranch2Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef subbranch3Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef detail1Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef detail2Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef detail3Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef subdetail3Class fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
`;

/**
 * Custom hook for generating and managing mindmap diagrams
 * (Now expects and sets only Mermaid code, never JSON)
 */
const useMindmapGenerator = () => {
  const [code, setCode] = useState<string>(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  /**
   * Generate a mindmap based on the PDF content in session storage
   */
  const generateMindmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get PDF text from session storage
      const pdfText = sessionStorage.getItem("pdfText");
      if (!pdfText) {
        throw new Error("No PDF content found. Please upload a PDF document first.");
      }

      // New: Service returns Mermaid code string directly
      const response = await generateMindmapFromPdf();
      
      if (response && response.trim().startsWith("mindmap")) {
        setCode(response);
      } else {
        throw new Error("Failed to generate a valid mindmap diagram from Gemini.");
      }
    } catch (err) {
      console.error("Error generating mindmap:", err);
      setError(err instanceof Error ? err.message : "Unknown error generating mindmap");
      // Keep the default mindmap so there's something to display
      if (code !== defaultMindmap) {
        setCode(defaultMindmap);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle changes to the mindmap code in the editor
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setError(null);
  };

  return {
    code,
    error,
    isGenerating,
    generateMindmap,
    handleCodeChange,
  };
};

export default useMindmapGenerator;
