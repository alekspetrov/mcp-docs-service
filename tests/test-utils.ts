import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach } from "vitest";

/**
 * Creates a temporary test directory for document operations
 */
export async function createTestDocsDir(): Promise<string> {
  const testDir = path.join(process.cwd(), "tests", "temp-docs");
  try {
    // Check if directory exists
    await fs.access(testDir);
    // If it exists, clean it up first
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    // Directory doesn't exist, which is fine
  }

  // Create the directory
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/**
 * Cleans up the temporary test directory
 */
export async function cleanupTestDocsDir(testDir: string): Promise<void> {
  try {
    // Use recursive deletion with force option
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    console.error("Error cleaning up test directory:", error);
  }
}

/**
 * Creates a sample document in the test directory
 */
export async function createSampleDocument(
  testDir: string,
  relativePath: string,
  content: string
): Promise<string> {
  const fullPath = path.join(testDir, relativePath);
  const dirPath = path.dirname(fullPath);

  // Ensure the directory exists
  await fs.mkdir(dirPath, { recursive: true });

  // Write the file
  await fs.writeFile(fullPath, content);
  return fullPath;
}

/**
 * Setup function for tests that need a temporary docs directory
 */
export function setupDocsDirTest() {
  let testDocsDir: string;

  beforeEach(async () => {
    testDocsDir = await createTestDocsDir();
  });

  afterEach(async () => {
    await cleanupTestDocsDir(testDocsDir);
  });

  return () => testDocsDir;
}

/**
 * Creates a sample document with frontmatter
 */
export function createSampleMarkdownContent(
  title: string,
  description: string,
  content: string
): string {
  return `---
title: ${title}
description: ${description}
author: Test
date: ${new Date().toISOString().split("T")[0]}
---

# ${title}

${content}
`;
}
