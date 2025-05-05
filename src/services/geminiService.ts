
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Store the PDF text in sessionStorage for chat functionality
    sessionStorage.setItem('pdfText', pdfText);
    
    // First, detect document type to use appropriate template
    const documentType = await detectDocumentType(pdfText);
    console.log("Detected document type:", documentType);
    
    // Select template based on document type
    const documentTemplate = getTemplateForDocumentType(documentType);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze the following document text and extract specific information to create a detailed mind map.
    This document has been detected as: ${documentType}.
    
    For each node, extract a SPECIFIC insight or detail from the document, NOT just generic placeholders.
    
    For the root node, use the document's actual title.
    For each section, include specific content from the document.
    For child nodes, extract actual data points, findings, arguments, or key information mentioned in the document.
    
    IMPORTANT:
    1. DO NOT use generic placeholders - instead, write actual findings or information from the document
    2. Extract SPECIFIC phrases from the text - use the actual content from the document
    3. Include actual numbers, percentages, and specific terminology used
    4. If certain information isn't available, make a reasonable inference based on the text
    
    Format the response as a JSON object with the following structure:
    ${JSON.stringify(documentTemplate, null, 2)}

    IMPORTANT REQUIREMENTS:
    1. Do NOT modify the structure of the template - keep ALL nodes.
    2. Replace the generic topic text with SPECIFIC content from the document.
    3. Keep all node IDs and directions as they are in the template.
    4. Keep each topic concise (under 10-15 words) but SPECIFIC to the document content.
    5. For the Summary section, include actual key points from the document.
    6. Only include the JSON in your response, nothing else.
    
    Here's the document text to analyze:
    ${pdfText.slice(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      const parsedResponse = JSON.parse(jsonString);
      
      // Store the raw template for backup
      sessionStorage.setItem('mindMapTemplate', JSON.stringify(documentTemplate));
      
      // Debug the response
      console.log("Parsed mindmap data:", JSON.stringify(parsedResponse.nodeData, null, 2));
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.log("Using template instead due to parsing error");
      
      // If parsing fails, use the template with the document title extracted, if possible
      try {
        const titleMatch = pdfText.match(/^(.+?)(?:\n|$)/);
        if (titleMatch && titleMatch[1]) {
          documentTemplate.nodeData.topic = titleMatch[1].trim();
        }
      } catch (e) {
        console.error("Error extracting title:", e);
      }
      
      return documentTemplate;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// New function to detect document type based on content
const detectDocumentType = async (pdfText: string): Promise<string> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Analyze this document text and classify the document type into ONE of these categories:
    - research_paper: Scientific or academic research papers with clear methodology, results sections
    - technical_document: Technical manuals, guides, or documentation
    - business_document: Business reports, proposals, presentations
    - legal_document: Legal contracts, agreements, policy documents
    - educational_material: Textbooks, tutorials, course materials
    - news_article: News articles or journalistic pieces
    - creative_work: Creative writing, stories, etc.
    - general_document: Any other document type
    
    Return ONLY ONE WORD from the above list (e.g., "research_paper") without any additional text or explanation.
    
    Document text:
    ${pdfText.slice(0, 5000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();
    
    // Extract just the document type
    const documentType = text.split(/[\s\n]/)[0].replace(/[^a-z_]/g, '');
    
    // Validate against allowed types
    const allowedTypes = [
      'research_paper', 
      'technical_document', 
      'business_document', 
      'legal_document', 
      'educational_material', 
      'news_article', 
      'creative_work', 
      'general_document'
    ];
    
    return allowedTypes.includes(documentType) ? documentType : 'general_document';
  } catch (error) {
    console.error("Error detecting document type:", error);
    return "general_document"; // Default to general document on error
  }
};

// Get appropriate template based on document type
const getTemplateForDocumentType = (documentType: string) => {
  switch(documentType) {
    case 'research_paper':
      return createResearchPaperTemplate();
    case 'technical_document':
      return createTechnicalDocumentTemplate();
    case 'business_document':
      return createBusinessDocumentTemplate();
    case 'legal_document':
      return createLegalDocumentTemplate();
    case 'educational_material':
      return createEducationalMaterialTemplate();
    case 'news_article':
      return createNewsArticleTemplate();
    case 'creative_work':
      return createCreativeWorkTemplate();
    case 'general_document':
    default:
      return createGeneralDocumentTemplate();
  }
};

// Template creators for different document types
const createResearchPaperTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Research Paper Title",
      "root": true,
      "children": [
        {
          "id": "summary",
          "topic": "Paper Summary",
          "direction": 0,
          "children": [
            { "id": "summary1", "topic": "Key Points" },
            { "id": "summary2", "topic": "Main Contributions" },
            { "id": "summary3", "topic": "Significance" }
          ]
        },
        {
          "id": "intro",
          "topic": "Introduction",
          "direction": 0,
          "children": [
            { "id": "intro1", "topic": "Background / Context" },
            { "id": "intro2", "topic": "Motivation / Problem Statement" },
            { "id": "intro3", "topic": "Research Gap" },
            { "id": "intro4", "topic": "Objective / Hypothesis" }
          ]
        },
        {
          "id": "method",
          "topic": "Methodology",
          "direction": 0,
          "children": [
            { "id": "method1", "topic": "Experimental Setup / Data Collection" },
            { "id": "method2", "topic": "Models / Theories / Frameworks" },
            { "id": "method3", "topic": "Procedures / Algorithms" },
            { "id": "method4", "topic": "Variables / Parameters" }
          ]
        },
        {
          "id": "results",
          "topic": "Results",
          "direction": 1,
          "children": [
            { "id": "results1", "topic": "Key Findings" },
            { "id": "results2", "topic": "Figures / Tables / Visualizations" },
            { "id": "results3", "topic": "Statistical Analysis" },
            { "id": "results4", "topic": "Observations" }
          ]
        },
        {
          "id": "discuss",
          "topic": "Discussion",
          "direction": 1,
          "children": [
            { "id": "discuss1", "topic": "Interpretation of Results" },
            { "id": "discuss2", "topic": "Comparison with Previous Work" },
            { "id": "discuss3", "topic": "Implications" },
            { "id": "discuss4", "topic": "Limitations" }
          ]
        },
        {
          "id": "concl",
          "topic": "Conclusion",
          "direction": 1,
          "children": [
            { "id": "concl1", "topic": "Summary of Contributions" },
            { "id": "concl2", "topic": "Future Work" },
            { "id": "concl3", "topic": "Final Remarks" }
          ]
        },
        {
          "id": "refs",
          "topic": "References",
          "direction": 0,
          "children": [
            { "id": "refs1", "topic": "Key Papers Cited" },
            { "id": "refs2", "topic": "Datasets / Tools" }
          ]
        },
        {
          "id": "supp",
          "topic": "Supplementary",
          "direction": 0,
          "children": [
            { "id": "supp1", "topic": "Additional Experiments" },
            { "id": "supp2", "topic": "Appendices" },
            { "id": "supp3", "topic": "Code / Data Availability" }
          ]
        }
      ]
    }
  };
};

const createTechnicalDocumentTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Technical Document Title",
      "root": true,
      "children": [
        {
          "id": "overview",
          "topic": "Overview",
          "direction": 0,
          "children": [
            { "id": "overview1", "topic": "Purpose" },
            { "id": "overview2", "topic": "Intended Audience" },
            { "id": "overview3", "topic": "Scope" }
          ]
        },
        {
          "id": "requirements",
          "topic": "Requirements",
          "direction": 0,
          "children": [
            { "id": "requirements1", "topic": "System Requirements" },
            { "id": "requirements2", "topic": "Prerequisites" },
            { "id": "requirements3", "topic": "Dependencies" }
          ]
        },
        {
          "id": "architecture",
          "topic": "Architecture",
          "direction": 0,
          "children": [
            { "id": "architecture1", "topic": "System Components" },
            { "id": "architecture2", "topic": "Data Flow" },
            { "id": "architecture3", "topic": "Interfaces" }
          ]
        },
        {
          "id": "implementation",
          "topic": "Implementation",
          "direction": 1,
          "children": [
            { "id": "implementation1", "topic": "Setup Instructions" },
            { "id": "implementation2", "topic": "Configuration" },
            { "id": "implementation3", "topic": "Code Examples" }
          ]
        },
        {
          "id": "usage",
          "topic": "Usage Guide",
          "direction": 1,
          "children": [
            { "id": "usage1", "topic": "Basic Operations" },
            { "id": "usage2", "topic": "Advanced Features" },
            { "id": "usage3", "topic": "Best Practices" }
          ]
        },
        {
          "id": "troubleshooting",
          "topic": "Troubleshooting",
          "direction": 1,
          "children": [
            { "id": "troubleshooting1", "topic": "Common Issues" },
            { "id": "troubleshooting2", "topic": "Error Messages" },
            { "id": "troubleshooting3", "topic": "Solutions" }
          ]
        },
        {
          "id": "appendices",
          "topic": "Appendices",
          "direction": 0,
          "children": [
            { "id": "appendices1", "topic": "Reference Materials" },
            { "id": "appendices2", "topic": "Glossary" },
            { "id": "appendices3", "topic": "Version History" }
          ]
        }
      ]
    }
  };
};

const createBusinessDocumentTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Business Document Title",
      "root": true,
      "children": [
        {
          "id": "executive",
          "topic": "Executive Summary",
          "direction": 0,
          "children": [
            { "id": "executive1", "topic": "Key Highlights" },
            { "id": "executive2", "topic": "Business Impact" },
            { "id": "executive3", "topic": "Recommendations" }
          ]
        },
        {
          "id": "background",
          "topic": "Background",
          "direction": 0,
          "children": [
            { "id": "background1", "topic": "Company Overview" },
            { "id": "background2", "topic": "Market Context" },
            { "id": "background3", "topic": "Current Situation" }
          ]
        },
        {
          "id": "analysis",
          "topic": "Analysis",
          "direction": 0,
          "children": [
            { "id": "analysis1", "topic": "Financial Data" },
            { "id": "analysis2", "topic": "Market Trends" },
            { "id": "analysis3", "topic": "Competitive Landscape" },
            { "id": "analysis4", "topic": "SWOT Analysis" }
          ]
        },
        {
          "id": "strategy",
          "topic": "Strategy",
          "direction": 1,
          "children": [
            { "id": "strategy1", "topic": "Business Objectives" },
            { "id": "strategy2", "topic": "Proposed Solutions" },
            { "id": "strategy3", "topic": "Implementation Plan" },
            { "id": "strategy4", "topic": "Timeline" }
          ]
        },
        {
          "id": "financials",
          "topic": "Financials",
          "direction": 1,
          "children": [
            { "id": "financials1", "topic": "Budget" },
            { "id": "financials2", "topic": "Projected ROI" },
            { "id": "financials3", "topic": "Risk Assessment" }
          ]
        },
        {
          "id": "conclusion",
          "topic": "Conclusion",
          "direction": 1,
          "children": [
            { "id": "conclusion1", "topic": "Key Takeaways" },
            { "id": "conclusion2", "topic": "Next Steps" },
            { "id": "conclusion3", "topic": "Call to Action" }
          ]
        },
        {
          "id": "appendix",
          "topic": "Appendix",
          "direction": 0,
          "children": [
            { "id": "appendix1", "topic": "Supporting Documents" },
            { "id": "appendix2", "topic": "References" },
            { "id": "appendix3", "topic": "Contact Information" }
          ]
        }
      ]
    }
  };
};

const createLegalDocumentTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Legal Document Title",
      "root": true,
      "children": [
        {
          "id": "parties",
          "topic": "Parties Involved",
          "direction": 0,
          "children": [
            { "id": "parties1", "topic": "Party A" },
            { "id": "parties2", "topic": "Party B" },
            { "id": "parties3", "topic": "Other Stakeholders" }
          ]
        },
        {
          "id": "definitions",
          "topic": "Definitions",
          "direction": 0,
          "children": [
            { "id": "definitions1", "topic": "Key Terms" },
            { "id": "definitions2", "topic": "Interpretations" },
            { "id": "definitions3", "topic": "Scope" }
          ]
        },
        {
          "id": "terms",
          "topic": "Terms & Conditions",
          "direction": 0,
          "children": [
            { "id": "terms1", "topic": "Rights" },
            { "id": "terms2", "topic": "Obligations" },
            { "id": "terms3", "topic": "Restrictions" },
            { "id": "terms4", "topic": "Timelines" }
          ]
        },
        {
          "id": "compliance",
          "topic": "Compliance & Liability",
          "direction": 1,
          "children": [
            { "id": "compliance1", "topic": "Legal Requirements" },
            { "id": "compliance2", "topic": "Warranties" },
            { "id": "compliance3", "topic": "Indemnification" },
            { "id": "compliance4", "topic": "Limitations" }
          ]
        },
        {
          "id": "termination",
          "topic": "Termination",
          "direction": 1,
          "children": [
            { "id": "termination1", "topic": "Conditions" },
            { "id": "termination2", "topic": "Procedures" },
            { "id": "termination3", "topic": "Consequences" }
          ]
        },
        {
          "id": "dispute",
          "topic": "Dispute Resolution",
          "direction": 1,
          "children": [
            { "id": "dispute1", "topic": "Governing Law" },
            { "id": "dispute2", "topic": "Jurisdiction" },
            { "id": "dispute3", "topic": "Process" }
          ]
        },
        {
          "id": "signatures",
          "topic": "Signatures & Dates",
          "direction": 0,
          "children": [
            { "id": "signatures1", "topic": "Authorized Signatories" },
            { "id": "signatures2", "topic": "Execution Date" },
            { "id": "signatures3", "topic": "Witness Information" }
          ]
        }
      ]
    }
  };
};

const createEducationalMaterialTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Educational Material Title",
      "root": true,
      "children": [
        {
          "id": "intro",
          "topic": "Introduction",
          "direction": 0,
          "children": [
            { "id": "intro1", "topic": "Learning Objectives" },
            { "id": "intro2", "topic": "Prerequisites" },
            { "id": "intro3", "topic": "Overview" }
          ]
        },
        {
          "id": "concepts",
          "topic": "Key Concepts",
          "direction": 0,
          "children": [
            { "id": "concepts1", "topic": "Foundational Ideas" },
            { "id": "concepts2", "topic": "Principles" },
            { "id": "concepts3", "topic": "Terminology" },
            { "id": "concepts4", "topic": "Models" }
          ]
        },
        {
          "id": "content",
          "topic": "Content Sections",
          "direction": 0,
          "children": [
            { "id": "content1", "topic": "Topic 1" },
            { "id": "content2", "topic": "Topic 2" },
            { "id": "content3", "topic": "Topic 3" },
            { "id": "content4", "topic": "Topic 4" }
          ]
        },
        {
          "id": "examples",
          "topic": "Examples & Applications",
          "direction": 1,
          "children": [
            { "id": "examples1", "topic": "Case Studies" },
            { "id": "examples2", "topic": "Demonstrations" },
            { "id": "examples3", "topic": "Practice Problems" }
          ]
        },
        {
          "id": "activities",
          "topic": "Learning Activities",
          "direction": 1,
          "children": [
            { "id": "activities1", "topic": "Exercises" },
            { "id": "activities2", "topic": "Group Work" },
            { "id": "activities3", "topic": "Self-Assessment" }
          ]
        },
        {
          "id": "resources",
          "topic": "Additional Resources",
          "direction": 1,
          "children": [
            { "id": "resources1", "topic": "References" },
            { "id": "resources2", "topic": "Further Reading" },
            { "id": "resources3", "topic": "Tools & Materials" }
          ]
        },
        {
          "id": "assessment",
          "topic": "Assessment",
          "direction": 0,
          "children": [
            { "id": "assessment1", "topic": "Quizzes" },
            { "id": "assessment2", "topic": "Projects" },
            { "id": "assessment3", "topic": "Rubrics" }
          ]
        }
      ]
    }
  };
};

const createNewsArticleTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "News Article Title",
      "root": true,
      "children": [
        {
          "id": "headline",
          "topic": "Headline & Subheading",
          "direction": 0,
          "children": [
            { "id": "headline1", "topic": "Main Headline" },
            { "id": "headline2", "topic": "Subheading" },
            { "id": "headline3", "topic": "Date & Publication" }
          ]
        },
        {
          "id": "summary",
          "topic": "Summary",
          "direction": 0,
          "children": [
            { "id": "summary1", "topic": "Key Points" },
            { "id": "summary2", "topic": "5W1H (Who, What, When, Where, Why, How)" },
            { "id": "summary3", "topic": "Significance" }
          ]
        },
        {
          "id": "content",
          "topic": "Main Content",
          "direction": 0,
          "children": [
            { "id": "content1", "topic": "Opening Paragraph" },
            { "id": "content2", "topic": "Event Details" },
            { "id": "content3", "topic": "Context & Background" },
            { "id": "content4", "topic": "Quotes & Statements" }
          ]
        },
        {
          "id": "perspectives",
          "topic": "Perspectives",
          "direction": 1,
          "children": [
            { "id": "perspectives1", "topic": "Main Sources" },
            { "id": "perspectives2", "topic": "Alternative Views" },
            { "id": "perspectives3", "topic": "Expert Opinions" }
          ]
        },
        {
          "id": "impact",
          "topic": "Impact & Implications",
          "direction": 1,
          "children": [
            { "id": "impact1", "topic": "Immediate Effects" },
            { "id": "impact2", "topic": "Long-term Consequences" },
            { "id": "impact3", "topic": "Affected Parties" }
          ]
        },
        {
          "id": "conclusion",
          "topic": "Conclusion",
          "direction": 1,
          "children": [
            { "id": "conclusion1", "topic": "Concluding Points" },
            { "id": "conclusion2", "topic": "Future Developments" },
            { "id": "conclusion3", "topic": "Final Thoughts" }
          ]
        },
        {
          "id": "metadata",
          "topic": "Article Metadata",
          "direction": 0,
          "children": [
            { "id": "metadata1", "topic": "Author Information" },
            { "id": "metadata2", "topic": "Sources & References" },
            { "id": "metadata3", "topic": "Related Articles" }
          ]
        }
      ]
    }
  };
};

const createCreativeWorkTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Creative Work Title",
      "root": true,
      "children": [
        {
          "id": "overview",
          "topic": "Overview",
          "direction": 0,
          "children": [
            { "id": "overview1", "topic": "Genre/Type" },
            { "id": "overview2", "topic": "Creator" },
            { "id": "overview3", "topic": "Context" }
          ]
        },
        {
          "id": "elements",
          "topic": "Key Elements",
          "direction": 0,
          "children": [
            { "id": "elements1", "topic": "Characters/Subjects" },
            { "id": "elements2", "topic": "Setting/Environment" },
            { "id": "elements3", "topic": "Style/Tone" },
            { "id": "elements4", "topic": "Symbols/Motifs" }
          ]
        },
        {
          "id": "structure",
          "topic": "Structure",
          "direction": 0,
          "children": [
            { "id": "structure1", "topic": "Beginning" },
            { "id": "structure2", "topic": "Middle" },
            { "id": "structure3", "topic": "End" },
            { "id": "structure4", "topic": "Narrative Arc/Organization" }
          ]
        },
        {
          "id": "themes",
          "topic": "Themes & Messages",
          "direction": 1,
          "children": [
            { "id": "themes1", "topic": "Main Themes" },
            { "id": "themes2", "topic": "Underlying Messages" },
            { "id": "themes3", "topic": "Interpretations" }
          ]
        },
        {
          "id": "techniques",
          "topic": "Techniques & Craft",
          "direction": 1,
          "children": [
            { "id": "techniques1", "topic": "Literary/Artistic Devices" },
            { "id": "techniques2", "topic": "Style Elements" },
            { "id": "techniques3", "topic": "Unique Approaches" }
          ]
        },
        {
          "id": "impact",
          "topic": "Impact & Reception",
          "direction": 1,
          "children": [
            { "id": "impact1", "topic": "Emotional Effect" },
            { "id": "impact2", "topic": "Cultural Significance" },
            { "id": "impact3", "topic": "Critical Reception" }
          ]
        },
        {
          "id": "context",
          "topic": "Contextual Information",
          "direction": 0,
          "children": [
            { "id": "context1", "topic": "Historical/Cultural Context" },
            { "id": "context2", "topic": "Influences" },
            { "id": "context3", "topic": "Related Works" }
          ]
        }
      ]
    }
  };
};

const createGeneralDocumentTemplate = () => {
  return {
    "nodeData": {
      "id": "root",
      "topic": "Document Title",
      "root": true,
      "children": [
        {
          "id": "summary",
          "topic": "Summary",
          "direction": 0,
          "children": [
            { "id": "summary1", "topic": "Key Points" },
            { "id": "summary2", "topic": "Purpose" },
            { "id": "summary3", "topic": "Scope" }
          ]
        },
        {
          "id": "content1",
          "topic": "Main Section 1",
          "direction": 0,
          "children": [
            { "id": "content1_1", "topic": "Key Information 1" },
            { "id": "content1_2", "topic": "Key Information 2" },
            { "id": "content1_3", "topic": "Key Information 3" }
          ]
        },
        {
          "id": "content2",
          "topic": "Main Section 2",
          "direction": 0,
          "children": [
            { "id": "content2_1", "topic": "Key Information 1" },
            { "id": "content2_2", "topic": "Key Information 2" },
            { "id": "content2_3", "topic": "Key Information 3" }
          ]
        },
        {
          "id": "content3",
          "topic": "Main Section 3",
          "direction": 1,
          "children": [
            { "id": "content3_1", "topic": "Key Information 1" },
            { "id": "content3_2", "topic": "Key Information 2" },
            { "id": "content3_3", "topic": "Key Information 3" }
          ]
        },
        {
          "id": "content4",
          "topic": "Main Section 4",
          "direction": 1,
          "children": [
            { "id": "content4_1", "topic": "Key Information 1" },
            { "id": "content4_2", "topic": "Key Information 2" },
            { "id": "content4_3", "topic": "Key Information 3" }
          ]
        },
        {
          "id": "conclusions",
          "topic": "Conclusions",
          "direction": 1,
          "children": [
            { "id": "conclusions1", "topic": "Main Takeaways" },
            { "id": "conclusions2", "topic": "Implications" },
            { "id": "conclusions3", "topic": "Next Steps" }
          ]
        },
        {
          "id": "additional",
          "topic": "Additional Information",
          "direction": 0,
          "children": [
            { "id": "additional1", "topic": "References" },
            { "id": "additional2", "topic": "Appendices" },
            { "id": "additional3", "topic": "Supplementary Material" }
          ]
        }
      ]
    }
  };
};

// Chat with Gemini about PDF content with citation support
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return "I don't have access to the PDF content. Please make sure you've uploaded a PDF first.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Use a history array to maintain context
    const prompt = `
    You are an AI research assistant chatting with a user about a PDF document. 
    The user has the following question or request: "${message}"
    
    Here's an excerpt from the document they're referring to (it may be truncated):
    ${pdfText.slice(0, 15000)}
    
    Provide a helpful, detailed, and accurate response based solely on the document content.
    
    IMPORTANT FORMATTING GUIDELINES:
    1. Use proper markdown formatting with clear headings (# for main headings, ## for subheadings).
    2. Format your response with **bold text** for emphasis and *italics* for technical terms.
    3. Use bullet points (- or *) and numbered lists (1., 2., etc.) for better organization.
    4. When referencing specific parts of the document, include a citation in this format: [citation:pageX] where X is the page number or section identifier.
    5. For multi-paragraph responses, use proper paragraph breaks.
    6. For important quotes or excerpts, use blockquotes (> text).
    7. Structure your response with a clear hierarchy: Start with a brief overview, then provide detailed information.
    
    If you can't answer based on the provided text, be honest about your limitations.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};

// New function to analyze images with Gemini vision capabilities
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage for context
    const pdfText = sessionStorage.getItem('pdfText');
    const pdfContext = pdfText ? pdfText.slice(0, 5000) : "";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process image data to ensure proper format
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Image = imageData.split(',')[1] || imageData;
    
    // Create the content parts including the image
    // Fixed version that matches the GenerativeAI library's expected types
    const prompt = `
      You are an AI research assistant helping a user understand content from an academic PDF. 
      The user has shared a snapshot from the PDF document. 
      Analyze the image and provide a detailed explanation of what's shown.
      If there are figures, charts, tables, equations, or diagrams, describe them thoroughly.
      If there is text content, summarize the key points and explain any technical concepts.
      Make connections to the broader context of the document if possible.
      
      Here's some context from the document (it may be truncated):
      ${pdfContext}
    `;
    
    // Create properly formatted content parts
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Image
      }
    };
    
    // Generate content with the image - fixed structure
    const result = await model.generateContent([
      prompt,
      imagePart
    ]);
    
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API vision error:", error);
    return "Sorry, I encountered an error while analyzing the image. Please try again.";
  }
};

// Enhanced function to generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
    // First detect document type to customize summary approach
    const documentType = await detectDocumentType(pdfText);
    console.log("Generating summary for document type:", documentType);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Customize prompt based on document type
    let prompt = `
    You are a document summarization assistant. Given the text of a ${documentType.replace('_', ' ')}, 
    generate a structured, concise, and clear summary with appropriate sections. Keep the writing professional and suited 
    for an audience who wants a snapshot of the document without reading it completely.

    Format the output as a JSON object with these section names as keys and the content as values:
    {
      "Summary": "1-2 sentence high-level summary of the entire document: what it covers, its main purpose, and key takeaway.",
    `;
    
    // Add type-specific sections
    if (documentType === 'research_paper') {
      prompt += `
      "Key Findings": "List the main statistical or scientific results clearly, point-wise. Highlight effect sizes, odds ratios, correlations, p-values, or any key quantitative result mentioned in the paper.",
      
      "Objectives": "State the research question(s) or aim(s) of the paper, mentioning the gap in the literature or problem the study tries to address.",
      
      "Methods": "Briefly describe the study design, data collection methods, and analysis approach.",
      
      "Results": "Summarize the main results in 3-5 sentences, focusing on how the data answered the objectives. Include any noteworthy statistics or patterns.",
      
      "Conclusions": "Summarize the implications of the study, what it contributes to the field, and any potential practical applications.",
      `;
    } 
    else if (documentType === 'technical_document' || documentType === 'educational_material') {
      prompt += `
      "Key Points": "List the main concepts, techniques, or instructions covered in the document.",
      
      "Purpose": "Explain the primary goal and intended use of this document.",
      
      "Main Topics": "Outline the major sections or topics covered in the document.",
      
      "Implementation": "Summarize any practical steps, methods, or procedures described.",
      
      "Requirements": "List any prerequisites, tools, or technologies mentioned as necessary.",
      `;
    } 
    else if (documentType === 'business_document') {
      prompt += `
      "Business Context": "Summarize the business situation, problem, or opportunity addressed.",
      
      "Key Recommendations": "List the main suggestions, decisions, or action items proposed.",
      
      "Financial Implications": "Outline any costs, revenue projections, or financial metrics mentioned.",
      
      "Timeline": "Summarize any schedules, deadlines, or time-related factors mentioned.",
      
      "Stakeholders": "List the key parties involved or affected by the content of this document.",
      `;
    }
    else if (documentType === 'legal_document') {
      prompt += `
      "Legal Framework": "Outline the primary legal principles, statutes, or regulations involved.",
      
      "Parties & Obligations": "List the key parties and their respective responsibilities or commitments.",
      
      "Key Provisions": "Summarize the most important terms, conditions, or clauses.",
      
      "Restrictions & Limitations": "Outline any notable constraints, prohibitions, or boundaries defined.",
      
      "Enforcement & Remedies": "Summarize provisions related to compliance, disputes, or consequences.",
      `;
    }
    else if (documentType === 'news_article') {
      prompt += `
      "Main Event": "Describe the primary incident, announcement, or development being reported.",
      
      "Key Players": "List the individuals, organizations, or groups central to the story.",
      
      "Timeline": "Outline when events occurred or are expected to occur.",
      
      "Significance": "Explain why this news matters and its broader implications.",
      
      "Perspectives": "Summarize the various viewpoints or statements from different sources.",
      `;
    }
    else if (documentType === 'creative_work') {
      prompt += `
      "Themes": "Identify the primary themes, messages, or motifs explored.",
      
      "Structure": "Describe how the work is organized or presented.",
      
      "Style & Technique": "Outline the notable stylistic elements or creative approaches used.",
      
      "Characters/Elements": "List the main characters, subjects, or key components featured.",
      
      "Context": "Summarize any relevant historical, cultural, or personal context for the work.",
      `;
    }
    else {
      prompt += `
      "Main Points": "List the most important information or arguments presented.",
      
      "Structure": "Describe how the document is organized and its main sections.",
      
      "Context": "Explain the background or situation surrounding this document.",
      
      "Implications": "Summarize what this document suggests, recommends, or concludes.",
      
      "Supporting Details": "List key facts, examples, or evidence presented to support main points.",
      `;
    }
    
    // Add Key Concepts section for all document types
    prompt += `
      "Key Concepts": "List 8-12 important keywords, terms, or concepts from the document for context and indexing."
    }
    
    IMPORTANT:
    - Use bullet points (format as '- Point text') for lists like Key Findings and Key Concepts.
    - Keep each section concise and focused on the most important information.
    - If the document doesn't contain information for a specific section, provide a brief note explaining this.
    - Format the output as proper JSON, not markdown or anything else.
    
    Document text:
    ${pdfText.slice(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini summary response as JSON:", parseError);
      throw new Error("Failed to generate summary. The AI response format was invalid.");
    }
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    throw error;
  }
};

// New function to generate flowchart from PDF content
export const generateFlowchartFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `flowchart TD
        A[Error] --> B[No PDF Content]
        B --> C[Please upload a PDF first]`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a simple, VALID and COLORFUL Mermaid flowchart based on this document text.

    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'flowchart TD'
    2. Nodes MUST have this format: A[Text] or A(Text) or A{Text} - no exceptions
    3. Node IDs MUST be simple alphanumeric: A, B, C1, process1 (NO special chars or hyphens)
    4. Connections MUST use EXACTLY TWO dashes: A --> B (not A->B or A---->B)
    5. Each line should define ONE connection or ONE node
    6. Max 12 nodes total
    7. For labels on arrows: A -->|Label text| B (use single pipes)
    8. Never use semicolons (;) in node text or connections
    9. EXTREMELY IMPORTANT: Never use hyphens (-) in node text. Replace ALL hyphens with spaces or underscores.
    10. IMPORTANT: Date ranges like 1871-2020 must be written as 1871_2020 in node text.
    11. IMPORTANT: Simple node text is best - keep it short, avoid special characters

    COLORFUL REQUIREMENT:
    - For each node, ADD a Mermaid class assignment line at the end as:
        class NODE_ID CLASSNAME
      where CLASSNAME is one of: success, warning, info, neutral, decision, default, danger.
    - Try to use a different class for every connected node so the flowchart looks colorful.
    - Example:
      flowchart TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Process One]
        B -->|No| D[Process Two]
        C --> E[End]
        D --> E
        class A success
        class B decision
        class C info
        class D warning
        class E default

    - Your output should use several classes so the colors are visible in the chart.

    Here's the document text:
    ${pdfText.slice(0, 8000)}

    Generate ONLY valid Mermaid flowchart code WITH the described COLORFUL class lines, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanMermaidSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `flowchart TD
      A[Error] --> B[Empty flowchart]
      B --> C[Please try again]`;
  }

  try {
    // Ensure the code starts with flowchart directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart TD\n" + cleaned;
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
      
      // Keep flowchart directive
      if (trimmedLine.startsWith('flowchart') || 
          trimmedLine.startsWith('subgraph') || 
          trimmedLine === 'end') {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax: ensure exactly two dashes
      let fixedLine = line;
      
      // Replace arrows with more or fewer than 2 dashes
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*([A-Za-z0-9_]+)/g, "$1 --> $2");
      
      // Fix arrows with labels too
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*\|([^|]*)\|\s*([A-Za-z0-9_]+)/g, "$1 -->|$2| $3");
      
      // Fix node IDs with hyphens by replacing with underscores
      fixedLine = fixedLine.replace(/\b([A-Za-z0-9]+)-([A-Za-z0-9]+)\b(?!\]|\)|\})/g, "$1_$2");
      
      // Fix date ranges in node text by replacing hyphens with underscores
      // Look for patterns like [text (1871-2020) text] and replace with [text (1871_2020) text]
      fixedLine = fixedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
      fixedLine = fixedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
      fixedLine = fixedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
      
      // Replace all remaining hyphens inside node text with spaces or underscores
      // Handle square brackets []
      fixedLine = fixedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle parentheses ()
      fixedLine = fixedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle curly braces {}
      fixedLine = fixedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
      
      // Fix nodes without brackets by adding them
      const nodeDefinitionRegex = /^([A-Za-z0-9_]+)\s+\[([^\]]+)\]/;
      const nodeWithoutBrackets = /^([A-Za-z0-9_]+)(\s+)(?!\[|\(|\{)(.*?)(\s*-->|\s*$)/;
      
      if (nodeWithoutBrackets.test(fixedLine)) {
        fixedLine = fixedLine.replace(nodeWithoutBrackets, "$1$2[$3]$4");
      }
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    // Validate: ensure there's at least one connection (arrow)
    const hasConnections = validLines.some(line => line.includes('-->'));
    
    if (!hasConnections) {
      console.warn("No connections found in flowchart, adding default connection");
      validLines.push("A[Start] --> B[End]");
    }
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning Mermaid syntax:", error);
    return `flowchart TD
      A[Error] --> B[Syntax Cleaning Failed]
      B --> C[Please try again]`;
  }
};

// New function to generate sequence diagram from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `sequenceDiagram
        participant Error
        participant User
        
        Error->>User: No PDF Content
        User->>Error: Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    ${pdfText.slice(0, 8000)}
    
    Generate ONLY valid Mermaid sequence diagram code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanSequenceDiagramSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Failed to generate diagram
      System->>Error: Please try again`;
  }
};

// Helper function to clean and fix common sequence diagram syntax issues
const cleanSequenceDiagramSyntax = (code: string): string => {
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

// New function to generate mindmap from PDF content
export const generateMindmapFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `mindmap
        root((Error))
          No PDF Content
            Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a valid Mermaid mindmap based on this document text. 
    
    IMPORTANT: Use ACTUAL SPECIFIC content from the document, not generic labels.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'mindmap'
    2. Use proper indentation for hierarchy
    3. Root node must use this exact syntax: root((Paper Title))
    4. First level nodes use text on their own line with proper indentation
    5. You can use these node styles:
       - Regular text node (just text)
       - Text in square brackets [Text]
       - Text in parentheses (Text)
       - Text in double parentheses ((Text))
    6. Max 3 levels of hierarchy
    7. Max 15 nodes total
    8. AVOID special characters that might break syntax
    9. NEVER use class declarations like "class node className"
    
    EXAMPLE CORRECT SYNTAX:
    mindmap
      root((Research on Machine Learning))
        Introduction
          Background on neural networks
          Problem of overfitting data
        Methodology
          LSTM architecture used
          Training on 50,000 examples
        Results
          93% accuracy achieved
          Compared to 85% baseline
    
    Here's the document text:
    ${pdfText.slice(0, 8000)}
    
    Generate ONLY valid Mermaid mindmap code with SPECIFIC content from the document, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanMindmapSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API mindmap generation error:", error);
    return `mindmap
      root((Error))
        Failed to generate mindmap
          Please try again`;
  }
};

// Helper function to clean and fix common Mermaid mindmap syntax issues
const cleanMindmapSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `mindmap
      root((Error))
        Empty mindmap
          Please try again`;
  }

  try {
    // Ensure the code starts with mindmap directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("mindmap")) {
      cleaned = "mindmap\n" + cleaned;
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
      
      // Keep mindmap directive
      if (trimmedLine.startsWith('mindmap')) {
        validLines.push(line);
        return;
      }
      
      // Remove semicolons which can cause issues
      let fixedLine = line;
      fixedLine = fixedLine.replace(/;/g, "");
      
      // Remove special characters that might break the syntax
      fixedLine = fixedLine.replace(/[<>]/g, m => m === '<' ? '(' : ')');
      
      // CRITICAL: Remove class declarations that could cause errors
      if (fixedLine.includes("class ")) {
        fixedLine = fixedLine.split("class ")[0].trim();
      }
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning mindmap syntax:", error);
    return `mindmap
      root((Error))
        Syntax Cleaning Failed
          Please try again`;
  }
};

