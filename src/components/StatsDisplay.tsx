
import { useEffect, useState } from "react";
import { getUsageStatistics } from "@/utils/analytics";
import { Skeleton } from "./ui/skeleton";

interface StatsDisplayProps {
  className?: string;
  refreshInterval?: number; // In milliseconds
}

const StatsDisplay = ({ 
  className = "", 
  refreshInterval = 60000 // Default refresh every minute
}: StatsDisplayProps) => {
  const [stats, setStats] = useState<{
    papersAnalyzed: number;
    researchersCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUsageStatistics();
        setStats(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();
    
    // Set up periodic refresh if interval > 0
    let intervalId: number | undefined;
    if (refreshInterval > 0) {
      intervalId = window.setInterval(fetchStats, refreshInterval);
    }
    
    // Clean up on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  return (
    <div className={`flex flex-wrap justify-center gap-8 ${className}`}>
      <div className="text-center">
        {loading && !stats ? (
          <Skeleton className="h-10 w-24 mb-2" />
        ) : (
          <div className="text-3xl font-bold text-blue-600">
            {stats?.papersAnalyzed.toLocaleString() || '0'}+
          </div>
        )}
        <div className="text-sm text-gray-600">Research Papers Analyzed</div>
      </div>
      
      <div className="text-center">
        {loading && !stats ? (
          <Skeleton className="h-10 w-24 mb-2" />
        ) : (
          <div className="text-3xl font-bold text-blue-600">
            {stats?.researchersCount.toLocaleString() || '0'}+
          </div>
        )}
        <div className="text-sm text-gray-600">Researchers Using MapMyPaper</div>
      </div>
      
      {error && (
        <div className="w-full text-center mt-2">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;
