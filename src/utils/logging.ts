/**
 * Logging utilities for the MCP Docs Service
 *
 * These utilities ensure that logs don't interfere with the MCP protocol communication.
 */

// Environment detection for different execution contexts
export const isCursorWrapper = process.env.MCP_CURSOR_WRAPPER === "true";
export const isNpxWrapper = process.env.MCP_NPX_WRAPPER === "true";
export const isInspector = process.env.MCP_INSPECTOR === "true";

/**
 * Safe logging function that won't interfere with MCP protocol
 * When running under Cursor or NPX, redirects all logs to stderr
 */
export const safeLog = (...args: any[]): void => {
  if (isCursorWrapper || isNpxWrapper) {
    console.error(...args);
  } else {
    console.log(...args);
  }
};

/**
 * Safe error logging function
 */
export const safeError = (...args: any[]): void => {
  console.error(...args);
};
