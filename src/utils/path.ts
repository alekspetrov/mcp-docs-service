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
 * Expands the home directory in a path (e.g., ~/docs -> /home/user/docs)
 */
export function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~" || p.startsWith("~/")) {
    return p.replace(/^~/, os.homedir());
  }
  return p;
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
  // Handle empty path by using the first allowed directory
  if (!p) {
    return allowedDirectories[0];
  }

  // Resolve the path
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
    // Try to resolve the path relative to the allowed directories
    for (const dir of allowedDirectories) {
      const resolvedPath = path.resolve(dir, p);
      try {
        // Check if the path exists
        await fs.access(resolvedPath);
        // If it exists, check if it's within an allowed directory
        const relativePath = path.relative(dir, resolvedPath);
        if (
          relativePath !== "" &&
          !relativePath.startsWith("..") &&
          !path.isAbsolute(relativePath)
        ) {
          return resolvedPath;
        }
      } catch (error) {
        // Path doesn't exist, continue to the next directory
      }
    }

    // If we get here, the path is not allowed
    throw new Error(
      `Access denied: ${p} is not within allowed directories. Allowed directories: ${allowedDirectories.join(
        ", "
      )}`
    );
  }

  return normalizedPath;
}
