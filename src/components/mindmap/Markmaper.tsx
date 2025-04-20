
import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

export const Markmaper = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const pdfText = sessionStorage.getItem('pdfData') || '';
    const transformer = new Transformer();
    
    // Convert PDF text to markdown-like structure
    const sections = pdfText.split('\n\n')
      .filter(section => section.trim().length > 0)
      .map(section => `- ${section.trim()}`)
      .join('\n');
    
    console.log('Creating markmap with text sections:', sections.substring(0, 100) + '...');
    
    const { root } = transformer.transform(sections);
    const mm = Markmap.create(svgRef.current);
    mm.setData(root);
    
    return () => {
      // Cleanup
      if (mm) {
        mm.destroy();
      }
    };
  }, []);

  return (
    <svg ref={svgRef} className="w-full h-full" />
  );
};
