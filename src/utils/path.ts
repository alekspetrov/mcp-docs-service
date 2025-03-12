import path from "path";
import os from "os";
import fs from "fs/promises";

/**
 * Normalizes a path consistently
 */
export function normalizePath(p: string): string {
  return path.normalize(p);
}

/**
 * Expands the home directory tilde (~) in a path
 */
export function expandHome(filepath: string): string {
  if (filepath.startsWith("~/") || filepath === "~") {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

/**
 * Validates that a path is within allowed directories
 * @param p The path to validate
 * @param allowedDirectories Array of allowed directory paths
 * @returns The normalized path if valid
 * @throws Error if path is not within allowed directories
 */
export async function validatePath(
  p: string,
  allowedDirectories: string[]
): Promise<string> {
  const normalizedPath = normalizePath(path.resolve(expandHome(p)));

  // Check if the path is exactly an allowed directory
  if (allowedDirectories.some((dir) => dir === normalizedPath)) {
    return normalizedPath;
  }

  // Check if the path is within any of the allowed directories
  const isAllowed = allowedDirectories.some((dir) => {
    const relativePath = path.relative(dir, normalizedPath);
    return (
      relativePath !== "" &&
      !relativePath.startsWith("..") &&
      !path.isAbsolute(relativePath)
    );
  });

  if (!isAllowed) {
    throw new Error(`Access denied: ${p} is not within allowed directories`);
  }

  return normalizedPath;
}
