#!/usr/bin/env node

/**
 * MCP Docs Service
 *
 * A Model Context Protocol implementation for documentation management.
 * This service provides tools for reading, writing, and managing markdown documentation.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { diffLines, createTwoFilesPatch } from "diff";
import { glob } from "glob";
import { minimatch } from "minimatch";

// Command line argument parsing
const args = process.argv.slice(2);
let docsDir = path.join(process.cwd(), "docs");
let createDir = false;
let runHealthCheck = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--docs-dir" && i + 1 < args.length) {
    docsDir = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === "--create-dir") {
    createDir = true;
  } else if (args[i] === "--health-check") {
    runHealthCheck = true;
  } else if (!args[i].startsWith("--")) {
    docsDir = path.resolve(args[i]);
  }
}

// Normalize path
docsDir = path.normalize(docsDir);

// Ensure docs directory exists
try {
  const stats = await fs.stat(docsDir);
  if (!stats.isDirectory()) {
    console.error(`Error: ${docsDir} is not a directory`);
    process.exit(1);
  }
} catch (error) {
  // Create directory if it doesn't exist and --create-dir is specified
  if (createDir) {
    try {
      await fs.mkdir(docsDir, { recursive: true });
      console.log(`Created docs directory: ${docsDir}`);

      // Create a sample README.md
      const readmePath = path.join(docsDir, "README.md");
      try {
        await fs.access(readmePath);
      } catch {
        const content = `---
title: Documentation
description: Project documentation
---

# Documentation

This is the documentation directory for your project.
`;
        await fs.writeFile(readmePath, content);
        console.log(`Created sample README.md in ${docsDir}`);
      }
    } catch (error) {
      console.error(`Error creating docs directory: ${error}`);
      process.exit(1);
    }
  } else {
    console.error(`Error: Docs directory does not exist: ${docsDir}`);
    console.error(`Use --create-dir to create it automatically`);
    process.exit(1);
  }
}

console.log(
  "MCP Documentation Service initialized with docs directory:",
  docsDir
);
console.log("Directory will be created if it doesn't exist");

// Schema definitions
const ReadDocumentArgsSchema = z.object({
  path: z
    .string()
    .describe("Path to the markdown document, relative to docs directory"),
});

const WriteDocumentArgsSchema = z.object({
  path: z
    .string()
    .describe("Path to the markdown document, relative to docs directory"),
  content: z
    .string()
    .describe("Content of the document, including frontmatter"),
  createDirectories: z
    .boolean()
    .default(true)
    .describe("Create parent directories if they don't exist"),
});

const EditDocumentArgsSchema = z.object({
  path: z
    .string()
    .describe("Path to the markdown document, relative to docs directory"),
  edits: z.array(
    z.object({
      oldText: z.string().describe("Text to search for - must match exactly"),
      newText: z.string().describe("Text to replace with"),
    })
  ),
  dryRun: z
    .boolean()
    .default(false)
    .describe("Preview changes using git-style diff format"),
});

const ListDocumentsArgsSchema = z.object({
  basePath: z
    .string()
    .optional()
    .default("")
    .describe("Base path within docs directory to list documents from"),
  recursive: z.boolean().default(false).describe("List documents recursively"),
});

const SearchDocumentsArgsSchema = z.object({
  query: z
    .string()
    .describe("Search query to find in document content or metadata"),
  basePath: z
    .string()
    .optional()
    .default("")
    .describe("Base path within docs directory to search documents from"),
});

const GenerateNavigationArgsSchema = z.object({
  basePath: z
    .string()
    .optional()
    .default("")
    .describe("Base path within docs directory to generate navigation from"),
  outputPath: z
    .string()
    .optional()
    .default("navigation.json")
    .describe("Path to output navigation file"),
});

const CheckDocumentationHealthArgsSchema = z.object({
  basePath: z
    .string()
    .optional()
    .default("")
    .describe("Base path within docs directory to check health of"),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Utility functions
function normalizePath(p: string): string {
  return path.normalize(p);
}

function expandHome(filepath: string): string {
  if (filepath.startsWith("~/") || filepath === "~") {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

async function validatePath(requestedPath: string): Promise<string> {
  // Resolve path relative to docs directory
  const resolvedPath = path.isAbsolute(requestedPath)
    ? requestedPath
    : path.join(docsDir, requestedPath);

  const normalizedPath = normalizePath(resolvedPath);

  // Check if path is within docs directory
  if (!normalizedPath.startsWith(docsDir)) {
    throw new Error(
      `Access denied - path outside docs directory: ${normalizedPath}`
    );
  }

  return normalizedPath;
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

async function applyDocumentEdits(
  filePath: string,
  edits: Array<{ oldText: string; newText: string }>,
  dryRun = false
): Promise<string> {
  // Read file content and normalize line endings
  const content = normalizeLineEndings(await fs.readFile(filePath, "utf-8"));

  // Apply edits sequentially
  let modifiedContent = content;
  for (const edit of edits) {
    const normalizedOld = normalizeLineEndings(edit.oldText);
    const normalizedNew = normalizeLineEndings(edit.newText);

    // If exact match exists, use it
    if (modifiedContent.includes(normalizedOld)) {
      modifiedContent = modifiedContent.replace(normalizedOld, normalizedNew);
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
      throw new Error(`Could not find exact match for edit:\n${edit.oldText}`);
    }
  }

  // Create unified diff
  const diff = createUnifiedDiff(content, modifiedContent, filePath);

  // Format diff with appropriate number of backticks
  let numBackticks = 3;
  while (diff.includes("`".repeat(numBackticks))) {
    numBackticks++;
  }
  const formattedDiff = `${"`".repeat(numBackticks)}diff\n${diff}${"`".repeat(
    numBackticks
  )}\n\n`;

  if (!dryRun) {
    await fs.writeFile(filePath, modifiedContent, "utf-8");
  }

  return formattedDiff;
}

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): {
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

// Generate navigation structure from documents
async function generateNavigation(basePath: string): Promise<any[]> {
  const baseDir = path.join(docsDir, basePath);
  const pattern = path.join(baseDir, "**/*.md");

  const files = await glob(pattern);

  // Sort files to ensure consistent order and process index.md files first
  files.sort((a, b) => {
    const aIsIndex = path.basename(a) === "index.md";
    const bIsIndex = path.basename(b) === "index.md";

    if (aIsIndex && !bIsIndex) return -1;
    if (!aIsIndex && bIsIndex) return 1;

    return a.localeCompare(b);
  });

  const navigation: any[] = [];
  const directoryMap: Record<string, any> = {};

  for (const file of files) {
    const relativePath = path.relative(docsDir, file);
    const content = await fs.readFile(file, "utf-8");
    const { frontmatter } = parseFrontmatter(content);

    const title = frontmatter.title || path.basename(file, ".md");
    const order =
      frontmatter.order !== undefined ? Number(frontmatter.order) : 999;

    const item = {
      title,
      path: relativePath,
      order,
      children: [],
    };

    const dirPath = path.dirname(relativePath);

    if (dirPath === "." || dirPath === basePath) {
      navigation.push(item);
    } else {
      // Create parent directories if they don't exist in the navigation
      const pathParts = dirPath.split(path.sep);
      let currentPath = "";
      let currentNavigation = navigation;

      for (const part of pathParts) {
        currentPath = currentPath ? path.join(currentPath, part) : part;

        if (!directoryMap[currentPath]) {
          const dirItem = {
            title: part,
            path: currentPath,
            order: 0,
            children: [],
          };

          directoryMap[currentPath] = dirItem;
          currentNavigation.push(dirItem);
        }

        currentNavigation = directoryMap[currentPath].children;
      }

      currentNavigation.push(item);
    }
  }

  // Sort navigation items by order
  function sortNavigation(items: any[]) {
    items.sort((a, b) => a.order - b.order);

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        sortNavigation(item.children);
      }
    }
  }

  sortNavigation(navigation);

  return navigation;
}

// Check documentation health
async function checkDocumentationHealth(basePath: string): Promise<{
  totalDocuments: number;
  documentsWithMissingFrontmatter: number;
  documentsWithMissingTitle: number;
  documentsWithMissingDescription: number;
  brokenLinks: number;
  orphanedDocuments: number;
  issues: string[];
  healthScore: number;
}> {
  const baseDir = path.join(docsDir, basePath);
  const pattern = path.join(baseDir, "**/*.md");

  const files = await glob(pattern);

  const results = {
    totalDocuments: files.length,
    documentsWithMissingFrontmatter: 0,
    documentsWithMissingTitle: 0,
    documentsWithMissingDescription: 0,
    brokenLinks: 0,
    orphanedDocuments: 0,
    issues: [] as string[],
  };

  // Check frontmatter and content
  for (const file of files) {
    const relativePath = path.relative(docsDir, file);
    const content = await fs.readFile(file, "utf-8");
    const { frontmatter } = parseFrontmatter(content);

    if (Object.keys(frontmatter).length === 0) {
      results.documentsWithMissingFrontmatter++;
      results.issues.push(`${relativePath}: Missing frontmatter`);
    }

    if (!frontmatter.title) {
      results.documentsWithMissingTitle++;
      results.issues.push(`${relativePath}: Missing title in frontmatter`);
    }

    if (!frontmatter.description) {
      results.documentsWithMissingDescription++;
      results.issues.push(
        `${relativePath}: Missing description in frontmatter`
      );
    }

    // Check for internal links
    const linkRegex = /\[.*?\]\((.*?)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[1];

      // Only check relative links to markdown files
      if (
        !link.startsWith("http") &&
        !link.startsWith("#") &&
        link.endsWith(".md")
      ) {
        const linkPath = path.join(path.dirname(file), link);

        try {
          await fs.access(linkPath);
        } catch {
          results.brokenLinks++;
          results.issues.push(`${relativePath}: Broken link to ${link}`);
        }
      }
    }
  }

  // Generate navigation to check for orphaned documents
  const navigation = await generateNavigation(basePath);

  function collectPaths(items: any[]): string[] {
    let paths: string[] = [];

    for (const item of items) {
      paths.push(item.path);

      if (item.children && item.children.length > 0) {
        paths = paths.concat(collectPaths(item.children));
      }
    }

    return paths;
  }

  const navigationPaths = collectPaths(navigation);

  for (const file of files) {
    const relativePath = path.relative(docsDir, file);

    if (!navigationPaths.includes(relativePath)) {
      results.orphanedDocuments++;
      results.issues.push(
        `${relativePath}: Orphaned document (not in navigation)`
      );
    }
  }

  // Calculate health score (0-100)
  const totalIssues =
    results.documentsWithMissingFrontmatter +
    results.documentsWithMissingTitle +
    results.documentsWithMissingDescription +
    results.brokenLinks +
    results.orphanedDocuments;

  const maxIssues = results.totalDocuments * 5; // 5 possible issues per document
  const healthScore = Math.max(
    0,
    100 - Math.round((totalIssues / maxIssues) * 100)
  );

  return {
    ...results,
    healthScore,
  };
}

// Server setup
const server = new Server(
  {
    name: "mcp-docs-service",
    version: "0.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_document",
        description:
          "Read a markdown document from the docs directory. Returns the document content " +
          "including frontmatter. Use this tool when you need to examine the contents of a " +
          "single document.",
        inputSchema: zodToJsonSchema(ReadDocumentArgsSchema) as ToolInput,
      },
      {
        name: "write_document",
        description:
          "Create a new markdown document or completely overwrite an existing document with new content. " +
          "Use with caution as it will overwrite existing documents without warning. " +
          "Can create parent directories if they don't exist.",
        inputSchema: zodToJsonSchema(WriteDocumentArgsSchema) as ToolInput,
      },
      {
        name: "edit_document",
        description:
          "Make line-based edits to a markdown document. Each edit replaces exact line sequences " +
          "with new content. Returns a git-style diff showing the changes made.",
        inputSchema: zodToJsonSchema(EditDocumentArgsSchema) as ToolInput,
      },
      {
        name: "list_documents",
        description:
          "List all markdown documents in the docs directory or a subdirectory. " +
          "Returns the relative paths to all documents.",
        inputSchema: zodToJsonSchema(ListDocumentsArgsSchema) as ToolInput,
      },
      {
        name: "search_documents",
        description:
          "Search for markdown documents containing specific text in their content or frontmatter. " +
          "Returns the relative paths to matching documents.",
        inputSchema: zodToJsonSchema(SearchDocumentsArgsSchema) as ToolInput,
      },
      {
        name: "generate_navigation",
        description:
          "Generate a navigation structure from the markdown documents in the docs directory. " +
          "Returns a JSON structure that can be used for navigation menus.",
        inputSchema: zodToJsonSchema(GenerateNavigationArgsSchema) as ToolInput,
      },
      {
        name: "check_documentation_health",
        description:
          "Check the health of the documentation by analyzing frontmatter, links, and navigation. " +
          "Returns a report with issues and a health score.",
        inputSchema: zodToJsonSchema(
          CheckDocumentationHealthArgsSchema
        ) as ToolInput,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_document": {
        const parsed = ReadDocumentArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for read_document: ${parsed.error}`
          );
        }
        const validPath = await validatePath(parsed.data.path);
        const content = await fs.readFile(validPath, "utf-8");
        return {
          content: [{ type: "text", text: content }],
          metadata: {
            path: parsed.data.path,
            ...parseFrontmatter(content).frontmatter,
          },
        };
      }

      case "write_document": {
        const parsed = WriteDocumentArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for write_document: ${parsed.error}`
          );
        }
        const validPath = await validatePath(parsed.data.path);

        // Create parent directories if needed
        if (parsed.data.createDirectories) {
          const dirPath = path.dirname(validPath);
          await fs.mkdir(dirPath, { recursive: true });
        }

        await fs.writeFile(validPath, parsed.data.content, "utf-8");
        return {
          content: [
            { type: "text", text: `Successfully wrote to ${parsed.data.path}` },
          ],
        };
      }

      case "edit_document": {
        const parsed = EditDocumentArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for edit_document: ${parsed.error}`
          );
        }
        const validPath = await validatePath(parsed.data.path);
        const result = await applyDocumentEdits(
          validPath,
          parsed.data.edits,
          parsed.data.dryRun
        );
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "list_documents": {
        const parsed = ListDocumentsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for list_documents: ${parsed.error}`
          );
        }

        const baseDir = path.join(docsDir, parsed.data.basePath);
        const pattern = parsed.data.recursive
          ? path.join(baseDir, "**/*.md")
          : path.join(baseDir, "*.md");

        const files = await glob(pattern);
        const relativePaths = files.map((file) => path.relative(docsDir, file));

        return {
          content: [{ type: "text", text: relativePaths.join("\n") }],
        };
      }

      case "search_documents": {
        const parsed = SearchDocumentsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for search_documents: ${parsed.error}`
          );
        }

        const baseDir = path.join(docsDir, parsed.data.basePath);
        const pattern = path.join(baseDir, "**/*.md");

        const files = await glob(pattern);
        const results = [];

        for (const file of files) {
          const content = await fs.readFile(file, "utf-8");
          if (content.toLowerCase().includes(parsed.data.query.toLowerCase())) {
            results.push(path.relative(docsDir, file));
          }
        }

        return {
          content: [
            {
              type: "text",
              text:
                results.length > 0
                  ? `Found ${
                      results.length
                    } matching documents:\n${results.join("\n")}`
                  : "No matching documents found",
            },
          ],
        };
      }

      case "generate_navigation": {
        const parsed = GenerateNavigationArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for generate_navigation: ${parsed.error}`
          );
        }

        const navigation = await generateNavigation(parsed.data.basePath);

        // Write navigation to file if outputPath is provided
        if (parsed.data.outputPath) {
          const outputPath = await validatePath(parsed.data.outputPath);
          await fs.writeFile(
            outputPath,
            JSON.stringify(navigation, null, 2),
            "utf-8"
          );
        }

        return {
          content: [
            {
              type: "text",
              text: `Navigation structure:\n${JSON.stringify(
                navigation,
                null,
                2
              )}`,
            },
          ],
        };
      }

      case "check_documentation_health": {
        const parsed = CheckDocumentationHealthArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for check_documentation_health: ${parsed.error}`
          );
        }

        const healthReport = await checkDocumentationHealth(
          parsed.data.basePath
        );

        return {
          content: [
            {
              type: "text",
              text: `Documentation Health Report:
Health Score: ${healthReport.healthScore}/100

Summary:
- Total Documents: ${healthReport.totalDocuments}
- Documents with Missing Frontmatter: ${
                healthReport.documentsWithMissingFrontmatter
              }
- Documents with Missing Title: ${healthReport.documentsWithMissingTitle}
- Documents with Missing Description: ${
                healthReport.documentsWithMissingDescription
              }
- Broken Links: ${healthReport.brokenLinks}
- Orphaned Documents: ${healthReport.orphanedDocuments}

Issues:
${healthReport.issues.map((issue) => `- ${issue}`).join("\n")}
`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Run health check if requested
if (runHealthCheck) {
  try {
    const healthReport = await checkDocumentationHealth("");
    console.log(`Documentation Health Report:`);
    console.log(`Health Score: ${healthReport.healthScore}/100`);
    console.log(`\nSummary:`);
    console.log(`- Total Documents: ${healthReport.totalDocuments}`);
    console.log(
      `- Documents with Missing Frontmatter: ${healthReport.documentsWithMissingFrontmatter}`
    );
    console.log(
      `- Documents with Missing Title: ${healthReport.documentsWithMissingTitle}`
    );
    console.log(
      `- Documents with Missing Description: ${healthReport.documentsWithMissingDescription}`
    );
    console.log(`- Broken Links: ${healthReport.brokenLinks}`);
    console.log(`- Orphaned Documents: ${healthReport.orphanedDocuments}`);
    console.log(`\nIssues:`);
    healthReport.issues.forEach((issue: string) => console.log(`- ${issue}`));
    process.exit(0);
  } catch (error) {
    console.error(`Error running health check: ${error}`);
    process.exit(1);
  }
}

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP Documentation Management Service started.");
  console.log("Using docs directory:", docsDir);
  console.log("Reading from stdin, writing results to stdout...");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
