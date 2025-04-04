
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

  // Return JSX instead of implicit undefined/void
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-2">Research Statistics</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : stats ? (
        <div className="space-y-1">
          <p>Papers analyzed: {stats.papersAnalyzed.toLocaleString()}</p>
          <p>Active researchers: {stats.researchersCount.toLocaleString()}</p>
        </div>
      ) : (
        <p>No statistics available</p>
      )}
    </div>
  );
};

export default StatsDisplay;
