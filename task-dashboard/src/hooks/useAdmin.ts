import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiPath, authFetch, createHeaders } from "../lib/api";
import type { AdminUser, AuditLogEntry, Paginated, Role } from "../types";
import { useDebounce } from "./useDebounce";

const USERS_PAGE_SIZE = 8;
const LOGS_PAGE_SIZE = 10;

type AuthCallbacks = {
  getAccessToken: () => string;
  getRefreshToken: () => string;
  onTokensRefreshed: (accessToken: string, refreshToken: string) => void;
  onRefreshFailed: () => void;
};

/**
 * Data layer for the admin console: user directory + role management and the
 * audit trail. Both endpoints are admin-only server side, so `enabled` is a UI
 * convenience — it avoids firing requests that would 403 for normal users, it
 * is not the access control itself.
 */
export function useAdmin(token: string, enabled: boolean, callbacks: AuthCallbacks) {
  // Keep the latest callbacks in a ref so fetch effects don't re-run whenever
  // the caller re-renders and passes a new object literal.
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const request = useCallback(
    (url: string, options: RequestInit = {}) =>
      authFetch(
        url,
        { ...options, headers: createHeaders(callbacksRef.current.getAccessToken()) },
        callbacksRef.current
      ),
    []
  );

  // Requests are only worth making for an authenticated admin.
  const active = Boolean(token) && enabled;

  // ─── Users ─────────────────────────────────────────────────────────────────
  const [fetchedUsers, setUsers] = useState<AdminUser[]>([]);
  const [fetchedUsersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState("");

  // ─── Audit log ─────────────────────────────────────────────────────────────
  const [fetchedLogs, setLogs] = useState<AuditLogEntry[]>([]);
  const [fetchedLogsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionFilter, setActionFilterValue] = useState("all");
  const [emailFilter, setEmailFilterValue] = useState("");
  const debouncedEmailFilter = useDebounce(emailFilter, 300);

  // Derive the empty state instead of clearing it from an effect, so signing
  // out never leaves a stale row rendered for a frame.
  const users = active ? fetchedUsers : [];
  const usersTotal = active ? fetchedUsersTotal : 0;
  const logs = active ? fetchedLogs : [];
  const logsTotal = active ? fetchedLogsTotal : 0;

  // A different filter means a different result set, so go back to page 1 as
  // part of the same update rather than correcting it afterwards.
  const setActionFilter = useCallback((value: string) => {
    setActionFilterValue(value);
    setLogsPage(1);
  }, []);

  const setEmailFilter = useCallback((value: string) => {
    setEmailFilterValue(value);
    setLogsPage(1);
  }, []);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Bumped after a mutation to force both lists to re-read from the server.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // ─── Fetch users ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setErrorMessage("");

        const params = new URLSearchParams({
          page: String(usersPage),
          limit: String(USERS_PAGE_SIZE),
        });

        const response = await request(apiPath(`/api/admin/users?${params}`), {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as Paginated<AdminUser> & { message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load users");
        }

        setUsers(data.items);
        setUsersTotal(data.pagination.total);
        setUsersTotalPages(data.pagination.totalPages);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setErrorMessage((error as Error).message);
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();

    return () => controller.abort();
  }, [active, usersPage, version, request]);

  // ─── Fetch audit logs ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();

    const fetchLogs = async () => {
      try {
        setLoadingLogs(true);

        const params = new URLSearchParams({
          page: String(logsPage),
          limit: String(LOGS_PAGE_SIZE),
        });

        if (actionFilter !== "all") params.set("action", actionFilter);
        if (debouncedEmailFilter.trim()) params.set("email", debouncedEmailFilter.trim());

        const response = await request(apiPath(`/api/audit?${params}`), {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as Paginated<AuditLogEntry> & { message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load audit log");
        }

        setLogs(data.items);
        setLogsTotal(data.pagination.total);
        setLogsTotalPages(data.pagination.totalPages);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setErrorMessage((error as Error).message);
        }
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();

    return () => controller.abort();
  }, [active, logsPage, actionFilter, debouncedEmailFilter, version, request]);

  // ─── Role management ───────────────────────────────────────────────────────
  const handleRoleChange = useCallback(
    async (user: AdminUser, role: Role) => {
      if (role === user.role) return;

      try {
        setSavingUserId(user._id);
        setErrorMessage("");
        setSuccessMessage("");

        const response = await request(apiPath(`/api/admin/users/${user._id}/role`), {
          method: "PATCH",
          body: JSON.stringify({ role }),
        });

        const data = (await response.json()) as { user?: AdminUser; message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to update role");
        }

        setUsers((previous) =>
          previous.map((current) => (current._id === user._id ? { ...current, role } : current))
        );
        setSuccessMessage(`${user.email} is now ${role}`);
        // The change itself is audited server side — pull the new entry in.
        refresh();
      } catch (error) {
        setErrorMessage((error as Error).message);
      } finally {
        setSavingUserId("");
      }
    },
    [request, refresh]
  );

  // Derived from the fetched list, not the conditionally-emptied one, so the
  // dependency is stable across renders.
  const adminCount = useMemo(
    () => (active ? fetchedUsers.filter((user) => user.role === "admin").length : 0),
    [active, fetchedUsers]
  );

  return {
    // users
    users,
    usersTotal,
    usersPage,
    usersTotalPages,
    setUsersPage,
    loadingUsers,
    savingUserId,
    adminCount,
    handleRoleChange,
    // audit
    logs,
    logsTotal,
    logsPage,
    logsTotalPages,
    setLogsPage,
    loadingLogs,
    actionFilter,
    setActionFilter,
    emailFilter,
    setEmailFilter,
    // shared
    errorMessage,
    successMessage,
    refresh,
  };
}
