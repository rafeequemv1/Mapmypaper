
import { initGeminiClient, getPdfText, truncatePdfText } from "./baseService";

// Generate sequence diagram from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Try to get PDF text safely
    let pdfText;
    try {
      pdfText = getPdfText();
    } catch (error) {
      console.warn("Could not get PDF text:", error);
      // Return a default diagram instead of throwing
      return `sequenceDiagram
        participant User
        participant PDF
        participant System
        
        User->>PDF: Upload document
        Note right of User: No PDF detected
        PDF->>System: Missing content
        System->>User: Please upload a PDF first`;
    }
    
    // Check if PDF text is actually valid before proceeding
    if (!pdfText || pdfText.trim().length < 100) {
      console.warn("PDF text is too short or empty");
      return `sequenceDiagram
        participant User
        participant PDF
        participant System
        
        User->>PDF: Upload document
        Note right of PDF: PDF text is too short
        PDF->>System: Insufficient content
        System->>User: Please upload a more detailed PDF`;
    }
    
    const model = initGeminiClient();
    
    const prompt = `
    Create a valid Mermaid sequence diagram based on this research document text. 
    The sequence diagram should visualize the methodology, experimental procedures, or workflow described in the document.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'sequenceDiagram'
    2. Participants defined with 'participant Name'
    3. Messages between participants use: ParticipantA->>ParticipantB: Message text 
    4. For activation/deactivation use: activate/deactivate ParticipantName
    5. For notes: Note right/left of ParticipantName: Note text
    6. Keep it simple with max 6-8 participants
    7. Focus on the key steps in the research methodology or experimental process
    8. Don't use any special characters that might break the syntax
    
    EXAMPLE CORRECT SYNTAX:
    sequenceDiagram
      participant Researcher
      participant Sample
      participant Instrument
      
      Researcher->>Sample: Prepare
      activate Sample
      Sample->>Instrument: Analyze
      Instrument->>Researcher: Return results
      deactivate Sample
      Note right of Researcher: Analyze data
    
    Here's the document text:
    ${truncatePdfText(pdfText, 8000)}
    
    Generate ONLY valid Mermaid sequence diagram code, nothing else.
    `;
    
    // Use Promise.race with timeout to prevent hanging
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 25 seconds")), 25000);
    });
    
    const generationPromise = model.generateContent(prompt)
      .then(result => result.response.text().trim())
      .then(text => {
        // Remove markdown code blocks if present
        return text
          .replace(/```mermaid\s?/g, "")
          .replace(/```\s?/g, "")
          .trim();
      });
    
    // Race against timeout
    try {
      const mermaidCode = await Promise.race([generationPromise, timeoutPromise]);
      return cleanSequenceDiagramSyntax(mermaidCode);
    } catch (timeoutError) {
      console.error("Gemini API request timed out:", timeoutError);
      return `sequenceDiagram
        participant User
        participant API
        participant System
        
        User->>API: Request diagram
        API->>System: Processing timeout
        System->>User: Request timed out, please try again`;
    }
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    // Return a valid diagram instead of throwing
    return `sequenceDiagram
      participant Error
      participant System
      participant User
      
      Error->>System: Failed to generate diagram
      System->>User: Error encountered
      User->>System: Please try again or edit manually`;
  }
};

// Helper function to clean and fix common sequence diagram syntax issues
export const cleanSequenceDiagramSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Empty diagram
      System->>Error: Please try again`;
  }

  try {
    // Ensure the code starts with sequenceDiagram directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("sequenceDiagram")) {
      cleaned = "sequenceDiagram\n" + cleaned;
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n');
    const validLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and keep comments
      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        validLines.push(line);
        return;
      }
      
      // Keep sequenceDiagram directive
      if (trimmedLine.startsWith('sequenceDiagram')) {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax if needed
      let fixedLine = line;
      
      // Fix arrows with two dashes only
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)/g, "$1->>$2");
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning sequence diagram syntax:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Syntax Cleaning Failed
      System->>Error: Please try again`;
  }
};
