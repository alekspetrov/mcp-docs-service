import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * Creates a temporary directory for testing
 */
export async function createTestDocsDir(): Promise<string> {
  const tmpDir = join(
    os.tmpdir(),
    `mcp-docs-service-test-${crypto.randomBytes(4).toString('hex')}`
  );
  await fs.mkdir(tmpDir, { recursive: true });
  return tmpDir;
}

/**
 * Cleans up the temporary test directory
 */
export async function cleanupTestDocsDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error cleaning up test directory: ${error}`);
  }
}

/**
 * Creates a sample markdown document with frontmatter
 */
export async function createSampleDocument(
  baseDir: string,
  relativePath: string,
  content: string
): Promise<void> {
  const filePath = join(baseDir, relativePath);
  
  // Create parent directory if it doesn't exist
  const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
  if (dirPath && dirPath !== baseDir) {
    await fs.mkdir(dirPath, { recursive: true });
  }
  
  await fs.writeFile(filePath, content);
}

/**
 * Creates sample markdown content with frontmatter
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
date: ${new Date().toISOString()}
tags:
  - test
  - sample
status: draft
---

# ${title}

${content}
`;
}