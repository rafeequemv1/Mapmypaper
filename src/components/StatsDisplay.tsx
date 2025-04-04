
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
    <div className={`grid grid-cols-2 gap-6 ${className}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats?.papersAnalyzed.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-gray-600 mt-1">Papers Analyzed</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats?.researchersCount.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-gray-600 mt-1">Researchers</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="col-span-2 text-center text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;
