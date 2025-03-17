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

  /**
   * Create a new folder in the docs directory
   */
  async createFolder(
    folderPath: string,
    createReadme = true
  ): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(folderPath);

      // Create the directory
      await fs.mkdir(validPath, { recursive: true });

      // Create a README.md file if requested
      if (createReadme) {
        const readmePath = path.join(validPath, "README.md");
        const folderName = path.basename(validPath);
        const content = `---
title: ${folderName}
description: Documentation for ${folderName}
date: ${new Date().toISOString()}
status: draft
---

# ${folderName}

This is the documentation for ${folderName}.
`;
        await fs.writeFile(readmePath, content, "utf-8");
      }

      return {
        content: [
          { type: "text", text: `Successfully created folder: ${folderPath}` },
        ],
        metadata: {
          path: folderPath,
          readme: createReadme ? path.join(folderPath, "README.md") : null,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error creating folder: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Move a document to a new location
   */
  async moveDocument(
    sourcePath: string,
    destinationPath: string,
    updateReferences = true
  ): Promise<ToolResponse> {
    try {
      const validSourcePath = await this.validatePath(sourcePath);
      const validDestPath = await this.validatePath(destinationPath);

      // Check if source exists
      try {
        await fs.access(validSourcePath);
      } catch {
        throw new Error(`Source file does not exist: ${sourcePath}`);
      }

      // Create destination directory if it doesn't exist
      const destDir = path.dirname(validDestPath);
      await fs.mkdir(destDir, { recursive: true });

      // Read the source file
      const content = await fs.readFile(validSourcePath, "utf-8");

      // Write to destination
      await fs.writeFile(validDestPath, content, "utf-8");

      // Delete the source file
      await fs.unlink(validSourcePath);

      // Update references if requested
      let referencesUpdated = 0;
      if (updateReferences) {
        referencesUpdated = await this.updateReferences(
          sourcePath,
          destinationPath
        );
      }

      return {
        content: [
          {
            type: "text",
            text:
              `Successfully moved document from ${sourcePath} to ${destinationPath}` +
              (referencesUpdated > 0
                ? `. Updated ${referencesUpdated} references.`
                : ""),
          },
        ],
        metadata: {
          sourcePath,
          destinationPath,
          referencesUpdated,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error moving document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Rename a document
   */
  async renameDocument(
    docPath: string,
    newName: string,
    updateReferences = true
  ): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);

      // Get directory and extension
      const dir = path.dirname(validPath);
      const ext = path.extname(validPath);

      // Create new path
      const newPath = path.join(dir, newName + ext);
      const validNewPath = await this.validatePath(newPath);

      // Check if source exists
      try {
        await fs.access(validPath);
      } catch {
        throw new Error(`Source file does not exist: ${docPath}`);
      }

      // Check if destination already exists
      try {
        await fs.access(validNewPath);
        throw new Error(`Destination file already exists: ${newPath}`);
      } catch (error) {
        // If error is "file doesn't exist", that's good
        if (
          !(
            error instanceof Error &&
            error.message.includes("Destination file already exists")
          )
        ) {
          // Continue with rename
        } else {
          throw error;
        }
      }

      // Read the source file
      const content = await fs.readFile(validPath, "utf-8");

      // Parse frontmatter
      const { frontmatter, content: docContent } = parseFrontmatter(content);

      // Update title in frontmatter if it exists
      if (frontmatter.title) {
        frontmatter.title = newName;
      }

      // Reconstruct content with updated frontmatter
      let frontmatterStr = "---\n";
      for (const [key, value] of Object.entries(frontmatter)) {
        if (Array.isArray(value)) {
          frontmatterStr += `${key}:\n`;
          for (const item of value) {
            frontmatterStr += `  - ${item}\n`;
          }
        } else {
          frontmatterStr += `${key}: ${value}\n`;
        }
      }
      frontmatterStr += "---\n\n";

      const updatedContent = frontmatterStr + docContent;

      // Write to new path
      await fs.writeFile(validNewPath, updatedContent, "utf-8");

      // Delete the source file
      await fs.unlink(validPath);

      // Update references if requested
      let referencesUpdated = 0;
      if (updateReferences) {
        const relativeSrcPath = path.relative(this.docsDir, validPath);
        const relativeDestPath = path.relative(this.docsDir, validNewPath);
        referencesUpdated = await this.updateReferences(
          relativeSrcPath,
          relativeDestPath
        );
      }

      return {
        content: [
          {
            type: "text",
            text:
              `Successfully renamed document from ${docPath} to ${newName}${ext}` +
              (referencesUpdated > 0
                ? `. Updated ${referencesUpdated} references.`
                : ""),
          },
        ],
        metadata: {
          originalPath: docPath,
          newPath: path.relative(this.docsDir, validNewPath),
          referencesUpdated,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error renaming document: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update navigation order for a document
   */
  async updateNavigationOrder(
    docPath: string,
    order: number
  ): Promise<ToolResponse> {
    try {
      const validPath = await this.validatePath(docPath);

      // Check if file exists
      try {
        await fs.access(validPath);
      } catch {
        throw new Error(`File does not exist: ${docPath}`);
      }

      // Read the file
      const content = await fs.readFile(validPath, "utf-8");

      // Parse frontmatter
      const { frontmatter, content: docContent } = parseFrontmatter(content);

      // Update order in frontmatter
      frontmatter.order = order;

      // Reconstruct content with updated frontmatter
      let frontmatterStr = "---\n";
      for (const [key, value] of Object.entries(frontmatter)) {
        if (Array.isArray(value)) {
          frontmatterStr += `${key}:\n`;
          for (const item of value) {
            frontmatterStr += `  - ${item}\n`;
          }
        } else {
          frontmatterStr += `${key}: ${value}\n`;
        }
      }
      frontmatterStr += "---\n\n";

      const updatedContent = frontmatterStr + docContent;

      // Write updated content
      await fs.writeFile(validPath, updatedContent, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated navigation order for ${docPath} to ${order}`,
          },
        ],
        metadata: {
          path: docPath,
          order,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error updating navigation order: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Create a new navigation section
   */
  async createSection(
    title: string,
    sectionPath: string,
    order?: number
  ): Promise<ToolResponse> {
    try {
      // Create the directory for the section
      const validPath = await this.validatePath(sectionPath);
      await fs.mkdir(validPath, { recursive: true });

      // Create an index.md file for the section
      const indexPath = path.join(validPath, "index.md");
      const validIndexPath = await this.validatePath(indexPath);

      // Create content with frontmatter
      let content = "---\n";
      content += `title: ${title}\n`;
      content += `description: ${title} section\n`;
      content += `date: ${new Date().toISOString()}\n`;
      content += `status: published\n`;
      if (order !== undefined) {
        content += `order: ${order}\n`;
      }
      content += "---\n\n";
      content += `# ${title}\n\n`;
      content += `Welcome to the ${title} section.\n`;

      // Write the index file
      await fs.writeFile(validIndexPath, content, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Successfully created section: ${title} at ${sectionPath}`,
          },
        ],
        metadata: {
          title,
          path: sectionPath,
          indexPath: path.join(sectionPath, "index.md"),
          order,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error creating section: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Update references to a moved or renamed document
   * @private
   */
  private async updateReferences(
    oldPath: string,
    newPath: string
  ): Promise<number> {
    // Normalize paths for comparison
    const normalizedOldPath = oldPath.replace(/\\/g, "/");
    const normalizedNewPath = newPath.replace(/\\/g, "/");

    // Find all markdown files
    const files = await glob("**/*.md", { cwd: this.docsDir });
    let updatedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.docsDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Look for references to the old path
      // Match markdown links: [text](path)
      const linkRegex = new RegExp(
        `\\[([^\\]]+)\\]\\(${normalizedOldPath.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}\\)`,
        "g"
      );

      // Match direct path references
      const pathRegex = new RegExp(
        normalizedOldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );

      // Replace references
      let updatedContent = content.replace(
        linkRegex,
        `[$1](${normalizedNewPath})`
      );
      updatedContent = updatedContent.replace(pathRegex, normalizedNewPath);

      // If content changed, write the updated file
      if (updatedContent !== content) {
        await fs.writeFile(filePath, updatedContent, "utf-8");
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Validate links in documentation
   */
  async validateLinks(basePath = "", recursive = true): Promise<ToolResponse> {
    try {
      const validBasePath = await this.validatePath(basePath || this.docsDir);

      // Find all markdown files
      const pattern = recursive ? "**/*.md" : "*.md";
      const files = await glob(pattern, { cwd: validBasePath });

      const brokenLinks: Array<{
        file: string;
        link: string;
        lineNumber: number;
      }> = [];

      // Check each file for links
      for (const file of files) {
        const filePath = path.join(validBasePath, file);
        const content = await fs.readFile(filePath, "utf-8");
        const lines = content.split("\n");

        // Find markdown links: [text](path)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let match;

          while ((match = linkRegex.exec(line)) !== null) {
            const [, , linkPath] = match;

            // Skip external links and anchors
            if (
              linkPath.startsWith("http://") ||
              linkPath.startsWith("https://") ||
              linkPath.startsWith("#") ||
              linkPath.startsWith("mailto:")
            ) {
              continue;
            }

            // Resolve the link path relative to the current file
            const fileDir = path.dirname(filePath);
            const resolvedPath = path.resolve(fileDir, linkPath);

            // Check if the link target exists
            try {
              await fs.access(resolvedPath);
            } catch {
              brokenLinks.push({
                file: path.relative(this.docsDir, filePath),
                link: linkPath,
                lineNumber: i + 1,
              });
            }
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text:
              brokenLinks.length > 0
                ? `Found ${brokenLinks.length} broken links in ${files.length} files`
                : `No broken links found in ${files.length} files`,
          },
        ],
        metadata: {
          brokenLinks,
          filesChecked: files.length,
          basePath: path.relative(this.docsDir, validBasePath),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error validating links: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }

  /**
   * Validate metadata in documentation
   */
  async validateMetadata(
    basePath = "",
    requiredFields?: string[]
  ): Promise<ToolResponse> {
    try {
      const validBasePath = await this.validatePath(basePath || this.docsDir);

      // Default required fields if not specified
      const fields = requiredFields || ["title", "description", "status"];

      // Find all markdown files
      const files = await glob("**/*.md", { cwd: validBasePath });

      const missingMetadata: Array<{
        file: string;
        missingFields: string[];
      }> = [];

      // Check each file for metadata
      for (const file of files) {
        const filePath = path.join(validBasePath, file);
        const content = await fs.readFile(filePath, "utf-8");

        // Parse frontmatter
        const { frontmatter } = parseFrontmatter(content);

        // Check for required fields
        const missing = fields.filter((field) => !frontmatter[field]);

        if (missing.length > 0) {
          missingMetadata.push({
            file: path.relative(this.docsDir, filePath),
            missingFields: missing,
          });
        }
      }

      // Calculate completeness percentage
      const totalFields = files.length * fields.length;
      const missingFields = missingMetadata.reduce(
        (sum, item) => sum + item.missingFields.length,
        0
      );
      const completenessPercentage =
        totalFields > 0
          ? Math.round(((totalFields - missingFields) / totalFields) * 100)
          : 100;

      return {
        content: [
          {
            type: "text",
            text:
              missingMetadata.length > 0
                ? `Found ${missingMetadata.length} files with missing metadata. Completeness: ${completenessPercentage}%`
                : `All ${files.length} files have complete metadata. Completeness: 100%`,
          },
        ],
        metadata: {
          missingMetadata,
          filesChecked: files.length,
          requiredFields: fields,
          completenessPercentage,
          basePath: path.relative(this.docsDir, validBasePath),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error validating metadata: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }
}
