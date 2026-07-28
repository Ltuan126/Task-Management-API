// Registers the jest-dom matchers (toBeInTheDocument, toHaveTextContent, …)
// and their type augmentation for Vitest's `expect`.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// `restoreMocks` handles the spies; this unmounts anything a test rendered so
// one case's DOM never leaks into the next.
afterEach(() => {
  cleanup();
});
