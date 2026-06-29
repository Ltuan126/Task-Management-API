import { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  BarElement,
  BarController,
  LineElement,
  LineController,
  DoughnutController,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip,
} from "chart.js";
import type { AnalyticsData } from "../hooks/useAnalytics";

Chart.register(
  ArcElement,
  BarElement,
  BarController,
  LineElement,
  LineController,
  DoughnutController,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip,
);

interface Props {
  data: AnalyticsData;
  loading: boolean;
  onRefresh: () => void;
}

export function AnalyticsPanel({ data, loading, onRefresh }: Props) {
  const statusChartRef = useRef<Chart | null>(null);
  const priorityChartRef = useRef<Chart | null>(null);
  const trendChartRef = useRef<Chart | null>(null);
  const tagsChartRef = useRef<Chart | null>(null);

  const statusCanvas = useRef<HTMLCanvasElement | null>(null);
  const priorityCanvas = useRef<HTMLCanvasElement | null>(null);
  const trendCanvas = useRef<HTMLCanvasElement | null>(null);
  const tagsCanvas = useRef<HTMLCanvasElement | null>(null);

  // Status Chart
  useEffect(() => {
    if (!statusCanvas.current) return;
    if (statusChartRef.current) statusChartRef.current.destroy();

    const stats = data.statusStats;
    const labels = stats.map((s) => s._id.toUpperCase());
    const counts = stats.map((s) => s.count);

    statusChartRef.current = new Chart(statusCanvas.current, {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["NO TASKS"],
        datasets: [
          {
            data: counts.length ? counts : [0],
            backgroundColor: [
              "#10b981", // green (completed)
              "#3b82f6", // blue (in-progress)
              "#f59e0b", // yellow (pending)
            ],
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#374151",
              font: { family: "Inter", size: 11, weight: "bold" },
            },
          },
        },
      },
    });

    return () => {
      if (statusChartRef.current) statusChartRef.current.destroy();
    };
  }, [data.statusStats]);

  // Priority Chart
  useEffect(() => {
    if (!priorityCanvas.current) return;
    if (priorityChartRef.current) priorityChartRef.current.destroy();

    const stats = data.priorityStats;
    const labels = stats.map((p) => p._id.toUpperCase());
    const counts = stats.map((p) => p.count);

    priorityChartRef.current = new Chart(priorityCanvas.current, {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["NONE"],
        datasets: [
          {
            label: "Tasks",
            data: counts.length ? counts : [0],
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "#10b981",
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: {
              color: "#6b7280",
              stepSize: 1,
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#374151" },
          },
        },
      },
    });

    return () => {
      if (priorityChartRef.current) priorityChartRef.current.destroy();
    };
  }, [data.priorityStats]);

  // Creation Trend Chart
  useEffect(() => {
    if (!trendCanvas.current) return;
    if (trendChartRef.current) trendChartRef.current.destroy();

    const stats = data.creationTrend;
    const labels = stats.map((t) => t._id);
    const counts = stats.map((t) => t.count);

    trendChartRef.current = new Chart(trendCanvas.current, {
      type: "line",
      data: {
        labels: labels.length ? labels : ["NO DATA"],
        datasets: [
          {
            label: "Created Tasks",
            data: counts.length ? counts : [0],
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: "#059669",
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: {
              color: "#6b7280",
              stepSize: 1,
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#374151" },
          },
        },
      },
    });

    return () => {
      if (trendChartRef.current) trendChartRef.current.destroy();
    };
  }, [data.creationTrend]);

  // Tags Chart
  useEffect(() => {
    if (!tagsCanvas.current) return;
    if (tagsChartRef.current) tagsChartRef.current.destroy();

    const stats = data.tagStats;
    const labels = stats.map((t) => t._id);
    const counts = stats.map((t) => t.count);

    tagsChartRef.current = new Chart(tagsCanvas.current, {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["NO TAGS"],
        datasets: [
          {
            label: "Tag Frequency",
            data: counts.length ? counts : [0],
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "#3b82f6",
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: "y", // horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: {
              color: "#6b7280",
              stepSize: 1,
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#374151" },
          },
        },
      },
    });

    return () => {
      if (tagsChartRef.current) tagsChartRef.current.destroy();
    };
  }, [data.tagStats]);

  const hasData =
    data.statusStats.length > 0 ||
    data.priorityStats.length > 0 ||
    data.creationTrend.length > 0 ||
    data.tagStats.length > 0;

  return (
    <div className="analytics-panel glass-panel">
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">📊 Rich Analytics</h2>
          <p className="analytics-subtitle">Real-time charts for task stats, priorities, trends, and tags</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`refresh-btn ${loading ? "spinning" : ""}`}
          title="Refresh Analytics"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>

      {!hasData && !loading ? (
        <div className="analytics-empty">
          <p>No task data available to calculate analytics. Create some tasks first!</p>
        </div>
      ) : (
        <div className="analytics-grid">
          <div className="chart-card">
            <h3>TASKS BY STATUS</h3>
            <div className="chart-wrapper">
              <canvas ref={statusCanvas} />
            </div>
          </div>

          <div className="chart-card">
            <h3>TASKS BY PRIORITY</h3>
            <div className="chart-wrapper">
              <canvas ref={priorityCanvas} />
            </div>
          </div>

          <div className="chart-card">
            <h3>CREATION TREND (LAST 7 DAYS)</h3>
            <div className="chart-wrapper">
              <canvas ref={trendCanvas} />
            </div>
          </div>

          <div className="chart-card">
            <h3>TOP TAGS</h3>
            <div className="chart-wrapper">
              <canvas ref={tagsCanvas} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
