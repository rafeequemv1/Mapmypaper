
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
  return (
    <div className={`flex justify-center gap-8 ${className}`}>
      {loading ? (
        <>
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-14 w-32" />
        </>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : stats ? (
        <>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.papersAnalyzed.toLocaleString()}</p>
            <p className="text-gray-500 text-sm">Papers Analyzed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.researchersCount.toLocaleString()}</p>
            <p className="text-gray-500 text-sm">Researchers</p>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default StatsDisplay;
