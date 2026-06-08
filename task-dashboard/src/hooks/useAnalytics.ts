import { useCallback, useEffect, useState } from "react";
import { apiPath, createHeaders } from "../lib/api";

export interface AnalyticsData {
  statusStats: Array<{ _id: string; count: number }>;
  priorityStats: Array<{ _id: string; count: number }>;
  creationTrend: Array<{ _id: string; count: number }>;
  tagStats: Array<{ _id: string; count: number }>;
}

const EMPTY_ANALYTICS: AnalyticsData = {
  statusStats: [],
  priorityStats: [],
  creationTrend: [],
  tagStats: [],
};

export function useAnalytics(token: string) {
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refreshAnalytics = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!token) {
      setAnalytics(EMPTY_ANALYTICS);
      return;
    }

    let cancelled = false;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(apiPath("/api/tasks/analytics"), {
          headers: createHeaders(token),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch analytics (HTTP ${res.status})`);
        }

        const data: AnalyticsData = await res.json();
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Something went wrong fetching analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [token, version]);

  return { analytics, loading, error, refreshAnalytics };
}
