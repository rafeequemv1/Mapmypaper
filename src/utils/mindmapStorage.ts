
import { supabase } from "@/integrations/supabase/client";

// TypeScript interface for mindmap project data
export interface MindMapProject {
  id: string;
  user_id: string;
  title: string;
  pdf_key: string | null;
  pdf_data: string | null;
  mindmap_data: string;
  chat_history: string;
  created_at: string;
}

// Get all mindmap projects for the current user
export async function getUserMindmapProjects(): Promise<MindMapProject[]> {
  const { data, error } = await supabase
    .from('user_mindmaps')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching user mindmaps:", error);
    throw error;
  }
  
  return data || [];
}

// Get a specific mindmap project by ID
export async function getMindmapProject(id: string): Promise<MindMapProject | null> {
  const { data, error } = await supabase
    .from('user_mindmaps')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error("Error fetching mindmap project:", error);
    throw error;
  }
  
  return data;
}

// Save a mindmap project
export async function saveMindmapProject(projectData: Omit<MindMapProject, 'id' | 'created_at'>): Promise<string> {
  const { data, error } = await supabase
    .from('user_mindmaps')
    .insert({
      ...projectData,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    console.error("Error saving mindmap project:", error);
    throw error;
  }
  
  return data?.id;
}

// Update an existing mindmap project
export async function updateMindmapProject(id: string, projectData: Partial<Omit<MindMapProject, 'id' | 'user_id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase
    .from('user_mindmaps')
    .update(projectData)
    .eq('id', id);
  
  if (error) {
    console.error("Error updating mindmap project:", error);
    throw error;
  }
}

// Delete a mindmap project
export async function deleteMindmapProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_mindmaps')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting mindmap project:", error);
    throw error;
  }
}

// Load a mindmap project into the current session
export async function loadMindmapProject(project: MindMapProject): Promise<void> {
  try {
    // Store PDF data if available
    if (project.pdf_key && project.pdf_data) {
      // Store in IndexedDB through fetch API
      const response = await fetch('/api/pdf/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: project.pdf_key,
          data: project.pdf_data,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to store PDF data');
      }
      
      // Set as current PDF
      sessionStorage.setItem('currentPdfKey', project.pdf_key);
    }
    
    // Store mindmap data
    if (project.mindmap_data) {
      sessionStorage.setItem(`mindMapData_${project.pdf_key}`, project.mindmap_data);
    }
    
    // Store chat history
    if (project.chat_history) {
      sessionStorage.setItem('chatHistory', project.chat_history);
    }
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('pdfListUpdated'));
    window.dispatchEvent(new CustomEvent('pdfSwitched', { 
      detail: { pdfKey: project.pdf_key } 
    }));
    
    return;
  } catch (error) {
    console.error("Error loading mindmap project:", error);
    throw error;
  }
}
