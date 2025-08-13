"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SolveHistory {
  id: number;
  facelet_string: string;
  solution: string[];
  move_count: number;
  solve_time_ms: number;
  timestamp: string;
  ip_address: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SolveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:8000/history");
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await response.json();

        // Handle the API response structure with solves array
        if (data && data.status === "success" && Array.isArray(data.solves)) {
          setHistory(data.solves);
        } else {
          console.log("Received data:", data);
          setHistory([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timeMs: number) => {
    if (timeMs < 1000) {
      return `${Math.round(timeMs)}ms`;
    }
    return `${Math.round(timeMs / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center !overflow-y-auto p-6">
        <div className="text-xl text-red-400 mb-4">Error: {error}</div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            {/* Back */}
          </button>
          <h1 className="text-3xl font-bold">Solve History</h1>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No solve history found</p>
            <p className="mt-2">
              Start solving cubes to see your history here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((solve) => (
              <div
                key={solve.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-gray-400">
                      {formatTimestamp(solve.timestamp)}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600/20 px-3 py-1 rounded-full">
                        <span className="text-blue-300 text-sm font-medium">
                          {solve.move_count} moves
                        </span>
                      </div>
                      <div className="bg-green-600/20 px-3 py-1 rounded-full">
                        <span className="text-green-300 text-sm font-medium">
                          {formatTime(solve.solve_time_ms)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">ID: {solve.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
