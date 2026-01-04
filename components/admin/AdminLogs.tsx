"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminCard from "@/components/admin/AdminCard";

interface Log {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  category: "api" | "admin" | "background" | "error" | "system";
  metadata?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

interface LogsResponse {
  logs: Log[];
  total: number;
  limit: number;
  offset: number;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(100);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPolling, setIsPolling] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabActiveRef = useRef(true);

  const fetchLogs = useCallback(async (since?: string) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setError("Not authenticated");
        return;
      }

      const token = session.data.session.access_token;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: "0", // Always fetch from start when polling
      });

      if (filterLevel !== "all") {
        params.append("level", filterLevel);
      }

      if (filterCategory !== "all") {
        params.append("category", filterCategory);
      }

      if (since) {
        params.append("since", since);
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data: LogsResponse = await response.json();
      
      if (since) {
        // Append new logs to the beginning
        setLogs((prev) => {
          const existingIds = new Set(prev.map((log) => log.id));
          const newLogs = data.logs.filter((log) => !existingIds.has(log.id));
          return [...newLogs, ...prev];
        });
      } else {
        // Initial load or filter change
        setLogs(data.logs);
        setTotal(data.total);
        setOffset(0);
      }

      setLastFetchTime(new Date().toISOString());
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setError(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterCategory, limit]);

  // Handle tab visibility for polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      if (!document.hidden && isPolling) {
        fetchLogs(lastFetchTime || undefined);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPolling, lastFetchTime, fetchLogs]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !isTabActiveRef.current) return;

    // Initial fetch
    fetchLogs();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (isTabActiveRef.current) {
        fetchLogs(lastFetchTime || undefined);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, fetchLogs, lastFetchTime]);

  // Refetch when filters change
  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [filterLevel, filterCategory]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "#ef4444";
      case "warn":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case "error":
        return "rgba(239, 68, 68, 0.1)";
      case "warn":
        return "rgba(245, 158, 11, 0.1)";
      case "info":
        return "rgba(59, 130, 246, 0.1)";
      default:
        return "rgba(107, 114, 128, 0.1)";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "api":
        return "#8b5cf6";
      case "admin":
        return "#ec4899";
      case "background":
        return "#14b8a6";
      case "error":
        return "#ef4444";
      case "system":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.category.toLowerCase().includes(query) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatMetadata = (metadata?: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    return JSON.stringify(metadata, null, 2);
  };

  if (loading && logs.length === 0) {
    return <p>Loading logs...</p>;
  }

  return (
    <div>
      {/* Controls */}
      <AdminCard maxWidth={1200}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 14 }}>Level:</label>
            <select
              className="select"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{ fontSize: 14 }}
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 14 }}>Category:</label>
            <select
              className="select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ fontSize: 14 }}
            >
              <option value="all">All</option>
              <option value="api">API</option>
              <option value="admin">Admin</option>
              <option value="background">Background</option>
              <option value="error">Error</option>
              <option value="system">System</option>
            </select>
          </div>

          <input
            className="input"
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: 14, minWidth: 200 }}
          />

          <button
            className="btn"
            onClick={() => {
              setLoading(true);
              fetchLogs();
            }}
            style={{ fontSize: 14 }}
          >
            Refresh
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
            />
            Auto-refresh
          </label>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 14 }}>
              Error: {error}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Showing {filteredLogs.length} of {total} logs
          {lastFetchTime && ` • Last updated: ${formatTimestamp(lastFetchTime)}`}
        </div>
      </AdminCard>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <AdminCard maxWidth={1200}>
          <p style={{ opacity: 0.6 }}>No logs found.</p>
        </AdminCard>
      ) : (
        <div>
          {filteredLogs.map((log) => (
            <AdminCard key={log.id} maxWidth={1200}>
              <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: getLevelColor(log.level),
                      background: getLevelBg(log.level),
                    }}
                  >
                    {log.level.toUpperCase()}
                  </div>

                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: getCategoryColor(log.category),
                      background: "rgba(0,0,0,0.05)",
                    }}
                  >
                    {log.category}
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.7, flex: 1 }}>
                    {formatTimestamp(log.created_at)}
                  </div>

                  {log.user_id && (
                    <div style={{ fontSize: 11, opacity: 0.5 }}>
                      User: {log.user_id.slice(0, 8)}...
                    </div>
                  )}

                  {log.ip_address && (
                    <div style={{ fontSize: 11, opacity: 0.5 }}>
                      IP: {log.ip_address}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {log.message}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details style={{ fontSize: 12 }}>
                    <summary style={{ cursor: "pointer", opacity: 0.7 }}>
                      View metadata
                    </summary>
                    <pre
                      style={{
                        marginTop: 8,
                        padding: 8,
                        background: "#f9fafb",
                        borderRadius: 4,
                        overflow: "auto",
                        fontSize: 11,
                      }}
                    >
                      {formatMetadata(log.metadata)}
                    </pre>
                  </details>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

