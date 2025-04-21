
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getUserMindmapProjects, loadMindmapProject, deleteMindmapProject, MindMapProject } from "@/utils/mindmapStorage";
import { useAuth } from "@/contexts/AuthContext";

const UserDashboard = () => {
  const [projects, setProjects] = useState<MindMapProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const userProjects = await getUserMindmapProjects();
        setProjects(userProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load your projects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user, navigate, toast]);

  const handleOpenProject = async (project: MindMapProject) => {
    try {
      await loadMindmapProject(project);
      navigate('/mindmap');
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to open the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteMindmapProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Mind Maps</h1>
        <Button asChild>
          <Link to="/mindmap">Create New</Link>
        </Button>
      </div>
      
      <Separator className="mb-6" />
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <p>Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You don't have any saved mind maps yet.</p>
          <Button asChild>
            <Link to="/mindmap">Create Your First Mind Map</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenProject(project)}
            >
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleOpenProject(project)}>
                  Open
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => handleDeleteProject(project.id, e)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
