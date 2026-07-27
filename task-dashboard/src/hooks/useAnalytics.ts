import { useCallback, useEffect, useState } from "react";
import { apiPath } from "../lib/api";
import type { AuthCallbacks } from "../lib/api";
import { useAuthRequest } from "./useAuthRequest";

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

export function useAnalytics(token: string, callbacks: AuthCallbacks) {
  const request = useAuthRequest(callbacks);

  const [fetchedAnalytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refreshAnalytics = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  // A refresh swaps in a new access token, so depending on the raw string here
  // would refetch everything for no reason — only signed-in vs. out matters.
  const active = Boolean(token);

  // Derive the signed-out state instead of clearing it from an effect, so
  // logging out never leaves a stale chart rendered for a frame.
  const analytics = active ? fetchedAnalytics : EMPTY_ANALYTICS;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await request(apiPath("/api/tasks/analytics"), { method: "GET" });

        if (!res.ok) {
          throw new Error(`Failed to fetch analytics (HTTP ${res.status})`);
        }

        const data: AnalyticsData = await res.json();
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Something went wrong fetching analytics");
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
  }, [active, version, request]);

  return { analytics, loading, error, refreshAnalytics };
}
