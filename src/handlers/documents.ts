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
import { writeFileSync } from "fs";

// Log debug info to file
function debugLog(message: string) {
  try {
    writeFileSync("docs/debug_log.txt", message + "\n", { flag: "a" });
  } catch (error) {
    // Silently fail if we can't write to the file
  }
}

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
  private singleDocPath: string;
  private useSingleDoc: boolean;

  constructor(docsDir: string, useSingleDoc = false) {
    this.docsDir = docsDir;
    this.useSingleDoc = useSingleDoc;
    this.singleDocPath = path.join(docsDir, "single_doc.md");
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
      // If single-doc mode is enabled, redirect to the single doc
      if (this.useSingleDoc) {
        const singleDocPath = path.join(this.docsDir, "single_doc.md");

        // Check if the requested path is a specific part
        if (docPath.startsWith("single_doc_part") && docPath.endsWith(".md")) {
          const requestedPartPath = path.join(this.docsDir, docPath);

          // Check if the requested part exists
          try {
            await fs.access(requestedPartPath);
            const content = await fs.readFile(requestedPartPath, "utf-8");

            return {
              content: [{ type: "text", text: content }],
              metadata: {
                path: docPath,
                ...this.parseFrontmatter(content).frontmatter,
              },
            };
          } catch (error) {
            // If the part doesn't exist, fall back to the index
            if (await this.fileExists(singleDocPath)) {
              const content = await fs.readFile(singleDocPath, "utf-8");
              return {
                content: [{ type: "text", text: content }],
                metadata: {
                  path: "single_doc.md",
                  ...this.parseFrontmatter(content).frontmatter,
                },
              };
            }
          }
        }

        // For all other requested documents in single-doc mode, serve the single document
        if (await this.fileExists(singleDocPath)) {
          const content = await fs.readFile(singleDocPath, "utf-8");

          // Check if this is an index file (indicating multi-part doc)
          const { frontmatter } = this.parseFrontmatter(content);
          if (
            content.includes("DOCUMENTATION INDEX") ||
            content.includes("Available Parts")
          ) {
            return {
              content: [{ type: "text", text: content }],
              metadata: {
                path: "single_doc.md",
                ...frontmatter,
                isIndex: true,
              },
            };
          }

          return {
            content: [{ type: "text", text: content }],
            metadata: {
              path: "single_doc.md",
              ...frontmatter,
            },
          };
        } else {
          // If single-doc doesn't exist yet, try to generate it
          await this.refreshSingleDoc();

          // Check if it was created successfully
          if (await this.fileExists(singleDocPath)) {
            const content = await fs.readFile(singleDocPath, "utf-8");
            return {
              content: [{ type: "text", text: content }],
              metadata: {
                path: "single_doc.md",
                ...this.parseFrontmatter(content).frontmatter,
              },
            };
          }

          // If it still doesn't exist, fall back to the requested path
        }
      }

      // Normal mode or fallback: read the actual requested document
      const validPath = await this.validatePath(docPath);
      const content = await fs.readFile(validPath, "utf-8");

      return {
        content: [{ type: "text", text: content }],
        metadata: {
          path: docPath,
          ...this.parseFrontmatter(content).frontmatter,
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
   * Helper method to check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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

      // Write the document
      await fs.writeFile(validPath, content, "utf-8");

      // If in single-doc mode, refresh the single doc
      if (this.useSingleDoc && !docPath.startsWith("single_doc")) {
        try {
          // Check if we have multi-part docs
          const parts = await glob(
            path.join(this.docsDir, "single_doc_part*.md")
          );

          if (parts.length > 0) {
            // If we have multi-part docs, refresh all parts
            await this.refreshSingleDoc();
          } else {
            // Check if single_doc.md exists
            const singleDocPath = path.join(this.docsDir, "single_doc.md");
            if (await this.fileExists(singleDocPath)) {
              // Refresh the single doc
              await this.refreshSingleDoc();
            }
          }
        } catch (refreshError) {
          // Log but don't fail if refreshing fails
          console.error("Error refreshing single doc:", refreshError);
        }
      }

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
      const relativePaths = files.map((file: string) =>
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

  /**
   * Estimate the number of tokens in a text string
   * This is a simple estimation: ~4 characters per token for English text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Splits content into multiple documents based on token limits
   * Returns the number of chunks created
   */
  private async createDocumentChunks(
    sections: Array<[string, string]>,
    template: string,
    maxTokens: number
  ): Promise<number> {
    // Create a base template for each chunk
    const projectName = path.basename(path.resolve(this.docsDir, ".."));
    const footer =
      "\n---\n\n_This document is automatically maintained and optimized for LLM context. This is part {part} of a multi-part document._\n";

    // Token budgeting
    const footerBaseTokens = this.estimateTokens(footer.replace("{part}", "X"));
    const templateTokens = this.estimateTokens(template);
    const availableTokensPerChunk =
      maxTokens - templateTokens - footerBaseTokens;

    // Track total tokens
    let currentChunk = 1;
    let currentTokens = 0;
    let chunkContent = "";

    for (const [section, content] of sections) {
      // Skip empty sections
      if (content.trim() === `## ${section}`.trim()) {
        continue;
      }

      const sectionTokens = this.estimateTokens(content);

      // Check if we need to start a new chunk
      if (
        currentTokens + sectionTokens > availableTokensPerChunk &&
        currentTokens > 0
      ) {
        // Write the current chunk to file
        const chunkPath = path.join(
          this.docsDir,
          `single_doc_part${currentChunk}.md`
        );

        const finalChunkContent =
          template +
          chunkContent +
          footer.replace("{part}", `${currentChunk}`) +
          `\n<!-- Token usage: ${
            currentTokens + templateTokens + footerBaseTokens
          }/${maxTokens} -->`;

        await fs.writeFile(chunkPath, finalChunkContent, "utf-8");

        // Reset for next chunk
        currentChunk++;
        currentTokens = 0;
        chunkContent = "";
      }

      // Add section to current chunk
      chunkContent += content + "\n";
      currentTokens += sectionTokens;
    }

    // Write the last chunk if there's any content
    if (chunkContent) {
      const chunkPath = path.join(
        this.docsDir,
        `single_doc_part${currentChunk}.md`
      );

      const finalChunkContent =
        template +
        chunkContent +
        footer.replace("{part}", `${currentChunk} of ${currentChunk}`) +
        `\n<!-- Token usage: ${
          currentTokens + templateTokens + footerBaseTokens
        }/${maxTokens} -->`;

      await fs.writeFile(chunkPath, finalChunkContent, "utf-8");
    }

    // Create an index file that lists all parts
    if (currentChunk > 1) {
      const indexPath = path.join(this.docsDir, "single_doc.md");
      let indexContent = `---
title: ${projectName} Documentation Index
description: Index of documentation parts optimized for LLM context
author: Documentation System
date: "${new Date().toISOString()}"
tags:
  - documentation
  - llm-optimized
status: published
version: 1.0.0
---

# ${projectName.toUpperCase()}: DOCUMENTATION INDEX

_This documentation has been split into multiple parts due to its size. Each part is optimized for LLM context._

## Available Parts

`;

      for (let i = 1; i <= currentChunk; i++) {
        indexContent += `- [Part ${i}](single_doc_part${i}.md)\n`;
      }

      indexContent +=
        "\n---\n\n_This index was automatically generated to manage documentation that exceeds token limits._\n";

      await fs.writeFile(indexPath, indexContent, "utf-8");
    }

    return currentChunk;
  }

  /**
   * Refresh the single document by recompiling all markdown files
   */
  async refreshSingleDoc(): Promise<ToolResponse> {
    const singleDocPath = path.join(this.docsDir, "single_doc.md");
    const MAX_TOKENS = 100000; // Limit to 100k tokens to fit within LLM context windows
    const MULTI_DOC_THRESHOLD = 9000; // Lower threshold for testing - if estimated tokens exceed this, create multiple docs

    try {
      // Get all markdown files
      const files = await glob(path.join(this.docsDir, "**/*.md"));

      // Filter out the single_doc.md itself and any single_doc_part*.md files
      const docsToProcess = files.filter(
        (file: string) => !path.basename(file).startsWith("single_doc")
      );

      debugLog(`Processing ${docsToProcess.length} documents`);

      // Create a template for the single doc
      const projectName = path.basename(path.resolve(this.docsDir, ".."));
      const template = `---
title: ${projectName} Documentation
description: Complete documentation optimized for LLM context
author: Documentation System
date: "${new Date().toISOString()}"
tags:
  - documentation
  - llm-optimized
status: published
version: 1.0.0
---

# ${projectName.toUpperCase()}: COMPLETE REFERENCE

_This document is automatically generated and optimized for LLM context. It contains the complete reference for ${projectName}._

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Integration](#integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Additional Information](#additional-information)

`;

      // Initialize sections
      const sections: Record<string, string> = {
        OVERVIEW: "## OVERVIEW\n\n",
        "CORE CONCEPTS": "## CORE CONCEPTS\n\n",
        FEATURES: "## FEATURES\n\n",
        "API REFERENCE": "## API REFERENCE\n\n",
        "USAGE EXAMPLES": "## USAGE EXAMPLES\n\n",
        INTEGRATION: "## INTEGRATION\n\n",
        "BEST PRACTICES": "## BEST PRACTICES\n\n",
        TROUBLESHOOTING: "## TROUBLESHOOTING\n\n",
        "ADDITIONAL INFORMATION": "## ADDITIONAL INFORMATION\n\n",
      };

      // Define section priorities (1 = highest priority)
      const sectionPriorities: Record<string, number> = {
        OVERVIEW: 1,
        FEATURES: 2,
        "API REFERENCE": 3,
        "USAGE EXAMPLES": 4,
        "CORE CONCEPTS": 5,
        INTEGRATION: 6,
        "BEST PRACTICES": 7,
        TROUBLESHOOTING: 8,
        "ADDITIONAL INFORMATION": 9,
      };

      // Read each document and add to appropriate section
      for (const file of docsToProcess) {
        const relativePath = path.relative(this.docsDir, file);
        const content = await fs.readFile(file, "utf-8");

        // Parse frontmatter
        const { frontmatter, content: docContent } =
          this.parseFrontmatter(content);

        // Skip empty documents
        if (!docContent.trim()) continue;

        // Determine which section to add to
        let targetSection = "ADDITIONAL INFORMATION";

        if (
          file.includes("api") ||
          (frontmatter.tags && frontmatter.tags.includes("api"))
        ) {
          targetSection = "API REFERENCE";
        } else if (
          file.includes("concept") ||
          (frontmatter.tags && frontmatter.tags.includes("concept"))
        ) {
          targetSection = "CORE CONCEPTS";
        } else if (
          file.includes("feature") ||
          (frontmatter.tags && frontmatter.tags.includes("feature"))
        ) {
          targetSection = "FEATURES";
        } else if (
          file.includes("example") ||
          (frontmatter.tags && frontmatter.tags.includes("example"))
        ) {
          targetSection = "USAGE EXAMPLES";
        } else if (
          file.includes("integration") ||
          (frontmatter.tags && frontmatter.tags.includes("integration"))
        ) {
          targetSection = "INTEGRATION";
        } else if (
          file.includes("best-practice") ||
          (frontmatter.tags && frontmatter.tags.includes("best-practice"))
        ) {
          targetSection = "BEST PRACTICES";
        } else if (
          file.includes("troubleshoot") ||
          (frontmatter.tags && frontmatter.tags.includes("troubleshoot"))
        ) {
          targetSection = "TROUBLESHOOTING";
        } else if (
          file.includes("overview") ||
          (frontmatter.tags && frontmatter.tags.includes("overview")) ||
          file.endsWith("README.md")
        ) {
          targetSection = "OVERVIEW";
        }

        // Add document to the section
        const title = frontmatter.title || path.basename(file, ".md");
        const formattedContent = `### ${title}\n\n_Source: ${relativePath}_\n\n${docContent}\n\n`;
        sections[targetSection] += formattedContent;
      }

      // Calculate estimated total size
      let estimatedTotalTokens = this.estimateTokens(template);
      debugLog(`Template tokens: ${estimatedTotalTokens}`);

      Object.entries(sections).forEach(([section, content]) => {
        const sectionTokens = this.estimateTokens(content);
        debugLog(`Section "${section}" tokens: ${sectionTokens}`);
        estimatedTotalTokens += sectionTokens;
      });

      debugLog(`Total estimated tokens: ${estimatedTotalTokens}`);
      debugLog(`Multi-doc threshold: ${MULTI_DOC_THRESHOLD}`);

      // Check if we need to split into multiple documents
      if (estimatedTotalTokens > MULTI_DOC_THRESHOLD) {
        debugLog("Threshold exceeded, creating multiple documents");
        // Delete any existing single_doc_part*.md files
        const existingParts = await glob(
          path.join(this.docsDir, "single_doc_part*.md")
        );
        for (const part of existingParts) {
          await fs.unlink(part);
        }

        // Create multiple document parts
        const prioritizedSections = Object.entries(sections).sort(
          ([sectionA], [sectionB]) =>
            sectionPriorities[sectionA] - sectionPriorities[sectionB]
        );

        const numChunks = await this.createDocumentChunks(
          prioritizedSections,
          template,
          MAX_TOKENS
        );

        return {
          content: [
            {
              type: "text",
              text: `Documentation exceeded token limits (${estimatedTotalTokens} estimated tokens). Created ${numChunks} document parts.`,
            },
          ],
        };
      }

      // If not exceeding the multi-doc threshold, continue with standard approach
      let totalTokens = this.estimateTokens(template);
      let includedDocuments = 0;
      let truncatedSections = 0;
      let omittedSections = 0;

      // Sort sections by priority
      const prioritizedSections = Object.entries(sections).sort(
        ([sectionA], [sectionB]) =>
          sectionPriorities[sectionA] - sectionPriorities[sectionB]
      );

      // Compile the final document with token limits
      let finalContent = template;
      const footer =
        "\n---\n\n_This document is automatically maintained and optimized for LLM context._\n";
      const footerTokens = this.estimateTokens(footer);

      // Reserve tokens for the footer
      const availableTokens = MAX_TOKENS - totalTokens - footerTokens;

      for (const [section, content] of prioritizedSections) {
        // Skip empty sections
        if (content.trim() === `## ${section}`.trim()) {
          continue;
        }

        const sectionTokens = this.estimateTokens(content);

        if (totalTokens + sectionTokens <= MAX_TOKENS - footerTokens) {
          // Full section fits
          finalContent += content + "\n";
          totalTokens += sectionTokens;

          // Count documents in this section
          const docMatches = content.match(/### .+/g);
          includedDocuments += docMatches ? docMatches.length : 0;
        } else {
          // Section doesn't fit entirely - try to include a truncated version
          omittedSections++;

          // Add a note about truncation
          const truncationNote = `## ${section} (Content Limit Reached)\n\nSome content in this section was omitted to fit within token limits.\n\n`;
          const truncationTokens = this.estimateTokens(truncationNote);

          if (totalTokens + truncationTokens <= MAX_TOKENS - footerTokens) {
            finalContent += truncationNote;
            totalTokens += truncationTokens;
            truncatedSections++;
          }
        }
      }

      // Add footer with token usage information
      finalContent += footer;

      // Add token usage metadata
      const tokenUsageInfo = `\n<!-- Token usage: ${totalTokens}/${MAX_TOKENS} (${Math.round(
        (totalTokens / MAX_TOKENS) * 100
      )}%) -->\n`;
      finalContent += tokenUsageInfo;

      // Delete any existing part files since we're creating a single file
      const existingParts = await glob(
        path.join(this.docsDir, "single_doc_part*.md")
      );
      for (const part of existingParts) {
        await fs.unlink(part);
      }

      // Write the file
      await fs.writeFile(singleDocPath, finalContent, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Successfully refreshed single_doc.md from ${
              docsToProcess.length
            } documents. Included ${includedDocuments} documents using ${totalTokens} tokens (${Math.round(
              (totalTokens / MAX_TOKENS) * 100
            )}% of limit).${
              truncatedSections > 0
                ? ` ${truncatedSections} sections were truncated.`
                : ""
            }${
              omittedSections > 0
                ? ` ${omittedSections} sections were omitted due to token limits.`
                : ""
            }`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error refreshing single_doc.md: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Parse frontmatter from a markdown document
   */
  private parseFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    content: string;
  } {
    // If no content, return empty
    if (!content || content.trim() === "") {
      return { frontmatter: {}, content: "" };
    }

    // Check if the content has frontmatter (starts with ---)
    if (!content.startsWith("---")) {
      return { frontmatter: {}, content };
    }

    try {
      // Find the end of the frontmatter
      const endIndex = content.indexOf("---", 3);
      if (endIndex === -1) {
        return { frontmatter: {}, content };
      }

      // Extract frontmatter and parse as YAML
      const frontmatterText = content.substring(3, endIndex).trim();
      const frontmatter = this.parseFrontmatterLines(frontmatterText);

      // Extract the content after frontmatter
      const contentWithoutFrontmatter = content.substring(endIndex + 3).trim();

      return { frontmatter, content: contentWithoutFrontmatter };
    } catch (error) {
      console.error("Error parsing frontmatter:", error);
      return { frontmatter: {}, content };
    }
  }

  /**
   * Parse frontmatter lines into an object
   */
  private parseFrontmatterLines(frontmatterText: string): Record<string, any> {
    const frontmatter: Record<string, any> = {};
    const lines = frontmatterText.split("\n");

    let currentKey: string | null = null;
    let isMultilineValue = false;
    let multilineValue = "";
    let isArray = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === "") continue;

      if (isMultilineValue) {
        if (trimmedLine.startsWith("  -")) {
          // Array item
          const value = trimmedLine.substring(3).trim();
          if (!Array.isArray(frontmatter[currentKey as string])) {
            frontmatter[currentKey as string] = [];
          }
          (frontmatter[currentKey as string] as string[]).push(value);
        } else if (trimmedLine.startsWith("  ")) {
          // Continuation of multiline value
          multilineValue += "\n" + trimmedLine.substring(2);
        } else {
          // End of multiline value
          if (multilineValue && !isArray) {
            frontmatter[currentKey as string] = multilineValue.trim();
            multilineValue = "";
          }
          isMultilineValue = false;
          isArray = false;
          currentKey = null;
        }
      }

      if (!isMultilineValue) {
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          currentKey = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();

          if (value === "" || value === "|" || value === ">") {
            // Multiline value
            isMultilineValue = true;
            multilineValue = "";
            isArray = false;
          } else if (
            value === "[]" ||
            (value.startsWith("[") && value.endsWith("]"))
          ) {
            // Array
            frontmatter[currentKey] =
              value === "[]"
                ? []
                : value
                    .substring(1, value.length - 1)
                    .split(",")
                    .map((v) => v.trim());
          } else {
            // Simple value
            if (value === "true") frontmatter[currentKey] = true;
            else if (value === "false") frontmatter[currentKey] = false;
            else if (!isNaN(Number(value)))
              frontmatter[currentKey] = Number(value);
            else
              frontmatter[currentKey] = value.replace(/^["'](.*)["']$/, "$1");
          }
        }
      }
    }

    return frontmatter;
  }
}
