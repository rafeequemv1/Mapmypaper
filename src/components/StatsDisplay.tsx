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

  // Return JSX with stat display
  return <div className={`text-center ${className}`}>
      {loading ? <div className="space-y-2">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div> : error ? <div className="text-sm text-muted-foreground">
          {error}
        </div> : stats ? <div className="flex gap-4 justify-center items-cente">
          <div>
            
            
          </div>
          <div className="h-8 border-l"></div>
          <div>
            
            
          </div>
        </div> : null}
    </div>;
};
export default StatsDisplay;