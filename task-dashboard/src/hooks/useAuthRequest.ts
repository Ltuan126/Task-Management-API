import { useCallback, useEffect, useRef } from "react";
import { authFetch, createHeaders } from "../lib/api";
import type { AuthCallbacks } from "../lib/api";

/**
 * Returns an authenticated `fetch` that transparently refreshes an expired
 * access token and retries, so a session outlives JWT_EXPIRES_IN (15m by
 * default) instead of bouncing the user to the login screen.
 *
 * The callbacks are kept in a ref and the returned `request` is stable for the
 * life of the hook, so a caller passing a fresh object literal on every render
 * doesn't re-trigger the fetch effects that depend on it. The access token is
 * read at call time rather than closed over, so a request issued after a
 * refresh still carries the current token.
 */
export function useAuthRequest(callbacks: AuthCallbacks) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  return useCallback(
    (url: string, options: RequestInit = {}) =>
      authFetch(
        url,
        { ...options, headers: createHeaders(callbacksRef.current.getAccessToken()) },
        callbacksRef.current
      ),
    []
  );
}
