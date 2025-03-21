
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Search, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface MindMap {
  id: string;
  title: string;
  description: string | null;
  pdf_filename: string | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch user's mindmaps
  useEffect(() => {
    const fetchMindMaps = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_mindmaps")
          .select("id, title, description, pdf_filename, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setMindMaps(data || []);
      } catch (error) {
        console.error("Error fetching mindmaps:", error);
        toast({
          title: "Error",
          description: "Failed to load your mindmaps",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMindMaps();
  }, [user, toast]);

  // Filter mindmaps based on search query
  const filteredMindMaps = mindMaps.filter(
    (mindMap) =>
      mindMap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mindMap.description &&
        mindMap.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredMindMaps.length / itemsPerPage);
  const paginatedMindMaps = filteredMindMaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Navigation handlers
  const handleCreateNew = () => {
    navigate("/");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // Load a mindmap
  const handleLoadMindMap = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("user_mindmaps")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Not found",
          description: "The selected mindmap could not be found",
          variant: "destructive",
        });
        return;
      }

      // Store the data in session storage
      if (data.mindmap_data) {
        sessionStorage.setItem("mindMapData", JSON.stringify(data.mindmap_data));
      }
      
      if (data.pdf_data) {
        sessionStorage.setItem("pdfData", data.pdf_data);
      }
      
      if (data.pdf_filename) {
        sessionStorage.setItem("pdfFileName", data.pdf_filename);
      }

      // Navigate to mindmap page
      navigate("/mindmap");
      
    } catch (error) {
      console.error("Error loading mindmap:", error);
      toast({
        title: "Error",
        description: "Failed to load the selected mindmap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a mindmap
  const confirmDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteMindMap = async () => {
    if (!confirmDeleteId) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from("user_mindmaps")
        .delete()
        .eq("id", confirmDeleteId);

      if (error) throw error;
      
      // Update the local state
      setMindMaps((prev) => prev.filter((m) => m.id !== confirmDeleteId));
      
      toast({
        title: "Deleted",
        description: "The mindmap has been deleted",
      });
      
    } catch (error) {
      console.error("Error deleting mindmap:", error);
      toast({
        title: "Error",
        description: "Failed to delete the mindmap",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#eaeaea] dark:border-[#333] bg-white dark:bg-[#111] p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#222]"
          >
            <Brain className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium text-black dark:text-white">
            MapMyPaper - Dashboard
          </h1>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-black text-white dark:bg-white dark:text-black"
        >
          <Plus className="mr-1 h-4 w-4" />
          New Mind Map
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 md:p-6">
        {/* Search and filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search your mind maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-[#222] text-black dark:text-white border-[#eaeaea] dark:border-[#444]"
            />
          </div>
        </div>

        {/* Mind Maps Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : paginatedMindMaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedMindMaps.map((mindMap) => (
              <Card
                key={mindMap.id}
                className="bg-white dark:bg-[#222] border-[#eaeaea] dark:border-[#444] hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-black dark:text-white truncate">
                    {mindMap.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatDate(mindMap.updated_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {mindMap.description || "No description provided"}
                  </p>
                  {mindMap.pdf_filename && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                      File: {mindMap.pdf_filename}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadMindMap(mindMap.id)}
                    className="text-black border-black dark:text-white dark:border-white"
                  >
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(mindMap.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? "No mind maps matching your search"
                : "You don't have any saved mind maps yet"}
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-black text-white dark:bg-white dark:text-black"
            >
              <Plus className="mr-1 h-4 w-4" />
              Create Your First Mind Map
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="bg-white dark:bg-[#222] text-black dark:text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this mind map? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
              className="text-black border-black dark:text-white dark:border-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMindMap}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
