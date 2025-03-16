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
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { zodToJsonSchema } from "zod-to-json-schema";

// Import our utilities
import { safeLog, expandHome, normalizePath } from "./utils/index.js";

// Import schemas
import {
  ReadDocumentSchema,
  WriteDocumentSchema,
  EditDocumentSchema,
  ListDocumentsSchema,
  SearchDocumentsSchema,
  CheckDocumentationHealthSchema,
  CreateFolderSchema,
  MoveDocumentSchema,
  RenameDocumentSchema,
  UpdateNavigationOrderSchema,
  CreateSectionSchema,
  ValidateLinksSchema,
  ValidateMetadataSchema,
} from "./schemas/index.js";

// Import handlers
import {
  DocumentHandler,
  NavigationHandler,
  HealthCheckHandler,
} from "./handlers/index.js";

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
docsDir = normalizePath(docsDir);

// Ensure docs directory exists
async function ensureDocsDirectory() {
  try {
    const stats = await fs.stat(docsDir);
    if (!stats.isDirectory()) {
      safeLog(`Error: ${docsDir} is not a directory`);
      process.exit(1);
    }
  } catch (error) {
    // Create directory if it doesn't exist and --create-dir is specified
    if (createDir) {
      try {
        await fs.mkdir(docsDir, { recursive: true });
        safeLog(`Created docs directory: ${docsDir}`);

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
          safeLog(`Created sample README.md in ${docsDir}`);
        }
      } catch (error) {
        safeLog(`Error creating docs directory: ${error}`);
        process.exit(1);
      }
    } else {
      safeLog(`Error: Docs directory does not exist: ${docsDir}`);
      safeLog(`Use --create-dir to create it automatically`);
      process.exit(1);
    }
  }
}

// Initialize handlers
const documentHandler = new DocumentHandler(docsDir);
const navigationHandler = new NavigationHandler(docsDir);
const healthCheckHandler = new HealthCheckHandler(docsDir);

// Server setup
const server = new Server(
  {
    name: "mcp-docs-service",
    version: "0.4.0",
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
        inputSchema: zodToJsonSchema(ReadDocumentSchema) as any,
      },
      {
        name: "write_document",
        description:
          "Create a new markdown document or completely overwrite an existing document with new content. " +
          "Use with caution as it will overwrite existing documents without warning. " +
          "Can create parent directories if they don't exist.",
        inputSchema: zodToJsonSchema(WriteDocumentSchema) as any,
      },
      {
        name: "edit_document",
        description:
          "Make line-based edits to a markdown document. Each edit replaces exact line sequences " +
          "with new content. Returns a git-style diff showing the changes made.",
        inputSchema: zodToJsonSchema(EditDocumentSchema) as any,
      },
      {
        name: "list_documents",
        description:
          "List all markdown documents in the docs directory or a subdirectory. " +
          "Returns the relative paths to all documents.",
        inputSchema: zodToJsonSchema(ListDocumentsSchema) as any,
      },
      {
        name: "search_documents",
        description:
          "Search for markdown documents containing specific text in their content or frontmatter. " +
          "Returns the relative paths to matching documents.",
        inputSchema: zodToJsonSchema(SearchDocumentsSchema) as any,
      },
      {
        name: "generate_documentation_navigation",
        description:
          "Generate a navigation structure from the markdown documents in the docs directory. " +
          "Returns a JSON structure that can be used for navigation menus.",
        inputSchema: zodToJsonSchema(ListDocumentsSchema) as any,
      },
      {
        name: "check_documentation_health",
        description:
          "Check the health of the documentation by analyzing frontmatter, links, and navigation. " +
          "Returns a report with issues and a health score.",
        inputSchema: zodToJsonSchema(CheckDocumentationHealthSchema) as any,
      },
      // New tools for Phase 2
      {
        name: "create_documentation_folder",
        description:
          "Create a new folder in the docs directory. Optionally creates a README.md file " +
          "in the new folder with basic frontmatter.",
        inputSchema: zodToJsonSchema(CreateFolderSchema) as any,
      },
      {
        name: "move_document",
        description:
          "Move a document from one location to another. Optionally updates references to the " +
          "document in other files.",
        inputSchema: zodToJsonSchema(MoveDocumentSchema) as any,
      },
      {
        name: "rename_document",
        description:
          "Rename a document while preserving its location and content. Optionally updates " +
          "references to the document in other files.",
        inputSchema: zodToJsonSchema(RenameDocumentSchema) as any,
      },
      {
        name: "update_documentation_navigation_order",
        description:
          "Update the navigation order of a document by modifying its frontmatter.",
        inputSchema: zodToJsonSchema(UpdateNavigationOrderSchema) as any,
      },
      {
        name: "create_documentation_section",
        description: "Create a new navigation section with an index.md file.",
        inputSchema: zodToJsonSchema(CreateSectionSchema) as any,
      },
      // New tools for Phase 3
      {
        name: "validate_documentation_links",
        description: "Check for broken internal links in documentation files.",
        inputSchema: zodToJsonSchema(ValidateLinksSchema) as any,
      },
      {
        name: "validate_documentation_metadata",
        description: "Ensure all documents have required metadata fields.",
        inputSchema: zodToJsonSchema(ValidateMetadataSchema) as any,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_document": {
        const parsed = ReadDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for read_document: ${parsed.error}`
          );
        }
        return await documentHandler.readDocument(parsed.data.path);
      }

      case "write_document": {
        const parsed = WriteDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for write_document: ${parsed.error}`
          );
        }
        return await documentHandler.writeDocument(
          parsed.data.path,
          parsed.data.content,
          parsed.data.createDirectories
        );
      }

      case "edit_document": {
        const parsed = EditDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for edit_document: ${parsed.error}`
          );
        }
        return await documentHandler.editDocument(
          parsed.data.path,
          parsed.data.edits,
          parsed.data.dryRun
        );
      }

      case "list_documents": {
        const parsed = ListDocumentsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for list_documents: ${parsed.error}`
          );
        }
        return await documentHandler.listDocuments(
          parsed.data.basePath,
          parsed.data.recursive
        );
      }

      case "search_documents": {
        const parsed = SearchDocumentsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for search_documents: ${parsed.error}`
          );
        }
        return await documentHandler.searchDocuments(
          parsed.data.query,
          parsed.data.basePath
        );
      }

      case "generate_documentation_navigation": {
        const parsed = ListDocumentsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for generate_navigation: ${parsed.error}`
          );
        }
        return await navigationHandler.generateNavigation(parsed.data.basePath);
      }

      case "check_documentation_health": {
        const parsed = CheckDocumentationHealthSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for check_documentation_health: ${parsed.error}`
          );
        }
        return await healthCheckHandler.checkDocumentationHealth(
          parsed.data.basePath
        );
      }

      // New tools for Phase 2
      case "create_documentation_folder": {
        const parsed = CreateFolderSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for create_folder: ${parsed.error}`
          );
        }
        return await documentHandler.createFolder(
          parsed.data.path,
          parsed.data.createReadme
        );
      }

      case "move_documentation_document": {
        const parsed = MoveDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for move_document: ${parsed.error}`
          );
        }
        return await documentHandler.moveDocument(
          parsed.data.sourcePath,
          parsed.data.destinationPath,
          parsed.data.updateReferences
        );
      }

      case "rename_documentation_document": {
        const parsed = RenameDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for rename_document: ${parsed.error}`
          );
        }
        return await documentHandler.renameDocument(
          parsed.data.path,
          parsed.data.newName,
          parsed.data.updateReferences
        );
      }

      case "update_documentation_navigation_order": {
        const parsed = UpdateNavigationOrderSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for update_navigation_order: ${parsed.error}`
          );
        }
        return await documentHandler.updateNavigationOrder(
          parsed.data.path,
          parsed.data.order
        );
      }

      case "create_section": {
        const parsed = CreateSectionSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for create_section: ${parsed.error}`
          );
        }
        return await documentHandler.createSection(
          parsed.data.title,
          parsed.data.path,
          parsed.data.order
        );
      }

      // New tools for Phase 3
      case "validate_documentation_links": {
        const parsed = ValidateLinksSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for validate_links: ${parsed.error}`
          );
        }
        return await documentHandler.validateLinks(
          parsed.data.basePath,
          parsed.data.recursive
        );
      }

      case "validate_documentation_metadata": {
        const parsed = ValidateMetadataSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for validate_metadata: ${parsed.error}`
          );
        }
        return await documentHandler.validateMetadata(
          parsed.data.basePath,
          parsed.data.requiredFields
        );
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
    const result = await healthCheckHandler.checkDocumentationHealth("");
    safeLog(result.content[0].text);
    process.exit(result.isError ? 1 : 0);
  } catch (error) {
    safeLog(`Error running health check: ${error}`);
    process.exit(1);
  }
} else {
  // Start server
  (async () => {
    try {
      await ensureDocsDirectory();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      safeLog("MCP Documentation Management Service started.");
      safeLog("Using docs directory:", docsDir);
      safeLog("Reading from stdin, writing results to stdout...");
    } catch (error) {
      safeLog("Fatal error running server:", error);
      process.exit(1);
    }
  })();
}
