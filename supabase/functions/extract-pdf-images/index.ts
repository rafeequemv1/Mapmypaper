
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno's run command to execute Python script
const { run } = Deno;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get PDF data from request
    const { pdf_data } = await req.json();
    
    if (!pdf_data) {
      return new Response(
        JSON.stringify({ error: 'PDF data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Convert base64 string to Uint8Array for Python processing
    const binString = atob(pdf_data.split(',')[1] || pdf_data);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    
    // Save PDF data to a temporary file
    await Deno.writeFile('temp.pdf', bytes);
    
    // Create Python script to extract images
    const pyScript = `
import sys
import base64
import json
from pypdf import PdfReader

def extract_images_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    extracted_images = []
    
    for page_num, page in enumerate(reader.pages, 1):
        if '/Resources' in page and '/XObject' in page['/Resources']:
            xobjects = page['/Resources']['/XObject']
            
            if isinstance(xobjects, dict):
                for key, xobject in xobjects.items():
                    if xobject['/Subtype'] == '/Image':
                        try:
                            data = xobject.get_data()
                            if data:
                                # Get image dimensions and format if available
                                width = xobject.get('/Width', 0)
                                height = xobject.get('/Height', 0)
                                
                                # Determine format based on filter
                                img_format = 'JPEG'  # Default format
                                if '/Filter' in xobject:
                                    filter_type = xobject['/Filter']
                                    if isinstance(filter_type, list):
                                        filter_type = filter_type[0]
                                    if filter_type == '/DCTDecode':
                                        img_format = 'JPEG'
                                    elif filter_type == '/FlateDecode':
                                        img_format = 'PNG'
                                    elif filter_type == '/JPXDecode':
                                        img_format = 'JP2'
                                
                                # Base64 encode the image data
                                encoded_img = base64.b64encode(data).decode('utf-8')
                                img_data = f"data:image/{img_format.lower()};base64,{encoded_img}"
                                
                                extracted_images.append({
                                    'data': img_data,
                                    'page': page_num,
                                    'width': width,
                                    'height': height,
                                    'format': img_format.lower()
                                })
                        except Exception as e:
                            print(f"Error processing image: {e}", file=sys.stderr)
    
    return extracted_images

if __name__ == "__main__":
    pdf_path = "temp.pdf"
    images = extract_images_from_pdf(pdf_path)
    print(json.dumps(images))
    `;
    
    await Deno.writeTextFile('extract_images.py', pyScript);
    
    // Run Python script to extract images
    const command = new Deno.Command('python3', {
      args: ['extract_images.py'],
      stdout: 'piped',
      stderr: 'piped',
    });
    
    const { stdout, stderr } = await command.output();
    
    // Check for errors
    const errorOutput = new TextDecoder().decode(stderr);
    if (errorOutput) {
      console.error('Python script error:', errorOutput);
    }
    
    // Get the extracted images data
    const output = new TextDecoder().decode(stdout);
    const images = JSON.parse(output);
    
    // Clean up temporary files
    try {
      await Deno.remove('temp.pdf');
      await Deno.remove('extract_images.py');
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
    
    // Return the extracted images
    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract images from PDF' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
