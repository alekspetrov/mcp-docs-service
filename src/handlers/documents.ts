/**
 * Document handlers for the MCP Docs Service
 *
 * These handlers implement the document management operations.
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { createTwoFilesPatch } from "diff";
import { safeLog } from "../utils/logging.js";
import { ToolResponse } from "../types/tools.js";

// File editing and diffing utilities
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function createUnifiedDiff(
  originalContent: string,
  newContent: string,
  filepath: string = "file"
): string {
  // Ensure consistent line endings for diff
  const normalizedOriginal = normalizeLineEndings(originalContent);
  const normalizedNew = normalizeLineEndings(newContent);

  return createTwoFilesPatch(
    filepath,
    filepath,
    normalizedOriginal,
    normalizedNew,
    "original",
    "modified"
  );
}

// Parse frontmatter from markdown content
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterStr = match[1];
  const contentWithoutFrontmatter = content.slice(match[0].length);

  // Parse frontmatter as key-value pairs
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Handle quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Handle arrays
      if (value.startsWith("[") && value.endsWith("]")) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if parsing fails
        }
      }

      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: contentWithoutFrontmatter };
}

export class DocumentHandler {
  private docsDir: string;

  constructor(docsDir: string) {
    this.docsDir = docsDir;
  }

  /**
   * Validates that a path is within the docs directory
   */
  async validatePath(requestedPath: string): Promise<string> {
    // Resolve path relative to docs directory
    const resolvedPath = path.isAbsolute(requestedPath)
      ? requestedPath
      : path.join(this.docsDir, requestedPath);

    const normalizedPath = path.normalize(resolvedPath);

    // Check if path is within docs directory
    if (!normalizedPath.startsWith(path.normalize(this.docsDir))) {
      throw new Error(
        `Access denied - path outside docs directory: ${normalizedPath}`
      );
    }

    return normalizedPath;
  }

  /**
   * Read a document from the docs directory
   */
  async readDocument(docPath: string): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);
      const content = await fs.readFile(validPath, "utf-8");

      return {
        content: [{ type: "text", text: content }],
        metadata: {
          path: docPath,
          ...parseFrontmatter(content).frontmatter,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error reading document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Write a document to the docs directory
   */
  async writeDocument(
    docPath: string,
    content: string,
    createDirectories = true
  ): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);

      // Create parent directories if needed
      if (createDirectories) {
        const dirPath = path.dirname(validPath);
        await fs.mkdir(dirPath, { recursive: true });
      }

      await fs.writeFile(validPath, content, "utf-8");

      return {
        content: [{ type: "text", text: `Successfully wrote to ${docPath}` }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error writing document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Apply edits to a document
   */
  async editDocument(
    docPath: string,
    edits: Array<{ oldText: string; newText: string }>,
    dryRun = false
  ): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);

      // Read file content and normalize line endings
      const content = normalizeLineEndings(
        await fs.readFile(validPath, "utf-8")
      );

      // Apply edits sequentially
      let modifiedContent = content;
      for (const edit of edits) {
        const normalizedOld = normalizeLineEndings(edit.oldText);
        const normalizedNew = normalizeLineEndings(edit.newText);

        // If exact match exists, use it
        if (modifiedContent.includes(normalizedOld)) {
          modifiedContent = modifiedContent.replace(
            normalizedOld,
            normalizedNew
          );
          continue;
        }

        // Otherwise, try line-by-line matching with flexibility for whitespace
        const oldLines = normalizedOld.split("\n");
        const contentLines = modifiedContent.split("\n");
        let matchFound = false;

        for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
          const potentialMatch = contentLines.slice(i, i + oldLines.length);

          // Compare lines with normalized whitespace
          const isMatch = oldLines.every((oldLine, j) => {
            const contentLine = potentialMatch[j];
            return oldLine.trim() === contentLine.trim();
          });

          if (isMatch) {
            // Preserve original indentation of first line
            const originalIndent = contentLines[i].match(/^\s*/)?.[0] || "";
            const newLines = normalizedNew.split("\n").map((line, j) => {
              if (j === 0) return originalIndent + line.trimStart();
              // For subsequent lines, try to preserve relative indentation
              const oldIndent = oldLines[j]?.match(/^\s*/)?.[0] || "";
              const newIndent = line.match(/^\s*/)?.[0] || "";
              if (oldIndent && newIndent) {
                const relativeIndent = newIndent.length - oldIndent.length;
                return (
                  originalIndent +
                  " ".repeat(Math.max(0, relativeIndent)) +
                  line.trimStart()
                );
              }
              return line;
            });

            contentLines.splice(i, oldLines.length, ...newLines);
            modifiedContent = contentLines.join("\n");
            matchFound = true;
            break;
          }
        }

        if (!matchFound) {
          throw new Error(
            `Could not find exact match for edit:\n${edit.oldText}`
          );
        }
      }

      // Create unified diff
      const diff = createUnifiedDiff(content, modifiedContent, docPath);

      // Format diff with appropriate number of backticks
      let numBackticks = 3;
      while (diff.includes("`".repeat(numBackticks))) {
        numBackticks++;
      }
      const formattedDiff = `${"`".repeat(
        numBackticks
      )}diff\n${diff}${"`".repeat(numBackticks)}\n\n`;

      if (!dryRun) {
        await fs.writeFile(validPath, modifiedContent, "utf-8");
      }

      return {
        content: [{ type: "text", text: formattedDiff }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error editing document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * List documents in the docs directory
   */
  async listDocuments(basePath = "", recursive = false): Promise<ToolResponse> {
    try {
      const baseDir = path.join(this.docsDir, basePath);
      const pattern = recursive
        ? path.join(baseDir, "**/*.md")
        : path.join(baseDir, "*.md");

      const files = await glob(pattern);
      const relativePaths = files.map((file) =>
        path.relative(this.docsDir, file)
      );

      return {
        content: [{ type: "text", text: relativePaths.join("\n") }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error listing documents: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Search for documents containing a query
   */
  async searchDocuments(query: string, basePath = ""): Promise<ToolResponse> {
    try {
      const baseDir = path.join(this.docsDir, basePath);
      const pattern = path.join(baseDir, "**/*.md");

      const files = await glob(pattern);
      const results = [];

      for (const file of files) {
        const content = await fs.readFile(file, "utf-8");
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push(path.relative(this.docsDir, file));
        }
      }

      return {
        content: [{ type: "text", text: results.join("\n") }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error searching documents: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Delete a document from the docs directory
   */
  async deleteDocument(docPath: string): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);
      await fs.unlink(validPath);

      return {
        content: [{ type: "text", text: `Successfully deleted ${docPath}` }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error deleting document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }
}
