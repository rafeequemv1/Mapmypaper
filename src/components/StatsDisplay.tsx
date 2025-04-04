
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
    <div className={`stats-display ${className}`}>
      {loading ? (
        <div className="flex gap-4">
          <div className="stat">
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="stat">
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : stats ? (
        <div className="flex gap-4">
          <div className="stat">
            <div className="text-2xl font-bold">{stats.papersAnalyzed.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Papers Analyzed</div>
          </div>
          <div className="stat">
            <div className="text-2xl font-bold">{stats.researchersCount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Researchers</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatsDisplay;
