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
import { NavigationHandler, HealthCheckHandler } from "./handlers/index.js";

// Import our document handler
import { DocumentHandler } from "./handlers/documents.js";

// Command line argument parsing
const args = process.argv.slice(2);
let docsDir = path.join(process.cwd(), "docs");
let createDir = false;
let runHealthCheck = false;
let useSingleDoc = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--docs-dir" && i + 1 < args.length) {
    docsDir = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === "--create-dir") {
    createDir = true;
  } else if (args[i] === "--health-check") {
    runHealthCheck = true;
  } else if (args[i] === "--single-doc") {
    useSingleDoc = true;
  } else if (!args[i].startsWith("--")) {
    docsDir = path.resolve(args[i]);
  }
}

// Normalize path
docsDir = normalizePath(docsDir);

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

// Create handlers
const documentHandler = new DocumentHandler(docsDir, useSingleDoc);
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
  if (useSingleDoc) {
    return {
      tools: [
        {
          name: "read_document",
          description:
            "Read a markdown document from the docs directory. Returns the document content " +
            "including frontmatter. In single-doc mode, this will always return the consolidated document.",
          inputSchema: zodToJsonSchema(ReadDocumentSchema) as any,
        },
        {
          name: "write_document",
          description:
            "Create a new markdown document or completely overwrite an existing document with new content. " +
            "In single-doc mode, this will automatically update the consolidated document.",
          inputSchema: zodToJsonSchema(WriteDocumentSchema) as any,
        },
        {
          name: "generate_llms_doc",
          description:
            "Generate a single comprehensive document optimized for LLMs by compiling content from all " +
            "markdown documents in the docs directory. This creates or refreshes the single_doc.md file.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "interactive_template",
          description:
            "Interactively prompts the human user for information to fill in a document template. " +
            "Useful for creating standardized documentation with user input.",
          inputSchema: {
            type: "object",
            properties: {
              template_type: {
                type: "string",
                description:
                  "The type of template to use (feature, api, guide, etc.)",
              },
              output_path: {
                type: "string",
                description:
                  "The path where the generated document should be saved",
              },
            },
            required: ["template_type", "output_path"],
          },
        },
      ],
    };
  } else {
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
          name: "create_folder",
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
          name: "update_navigation_order",
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
          description:
            "Check for broken internal links in documentation files.",
          inputSchema: zodToJsonSchema(ValidateLinksSchema) as any,
        },
        {
          name: "validate_documentation_metadata",
          description: "Ensure all documents have required metadata fields.",
          inputSchema: zodToJsonSchema(ValidateMetadataSchema) as any,
        },
      ],
    };
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Handle form responses
    if (request.params._meta?.formResponse && request.params._meta?.metadata) {
      const formResponse = request.params._meta.formResponse as Record<
        string,
        string
      >;
      const metadata = request.params._meta.metadata as Record<string, string>;

      if (metadata.template_type) {
        const templateType = metadata.template_type;
        const outputPath = metadata.output_path;

        // Format tags from comma-separated string
        const tags =
          formResponse.tags?.split(",").map((tag: string) => tag.trim()) || [];

        // Create frontmatter
        const frontmatter = {
          title: formResponse.title || "Untitled",
          description: formResponse.description || "",
          author: formResponse.author || "Unknown",
          tags,
          status: formResponse.status || "draft",
          date: new Date().toISOString(),
          version: "1.0.0",
        };

        // Create document content based on template type
        let content = `# ${formResponse.title || "Untitled"}\n\n${
          formResponse.description || ""
        }\n\n`;

        if (templateType === "feature") {
          content += `## Usage\n\nDescribe how to use this feature.\n\n`;
          content += `## Examples\n\nProvide examples of how to use this feature.\n\n`;
          content += `## Configuration\n\nDescribe any configuration options.\n\n`;
        } else if (templateType === "api") {
          content += `## Endpoint\n\n\`\`\`\n/api/path\n\`\`\`\n\n`;
        }

        // Format frontmatter
        const frontmatterYaml = `---\n${Object.entries(frontmatter)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}:\n${value
                .map((item) => `  - ${item}`)
                .join("\n")}`;
            }
            return `${key}: ${
              typeof value === "string" ? `"${value}"` : value
            }`;
          })
          .join("\n")}\n---\n\n`;

        // Create full document
        const fullContent = frontmatterYaml + content;

        // Write the document
        const docPath = path.join(docsDir, outputPath);
        const dirPath = path.dirname(docPath);

        try {
          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(docPath, fullContent, "utf-8");

          // If in single-doc mode, regenerate the single doc
          if (useSingleDoc) {
            const singleDocPath = path.join(docsDir, "single_doc.md");
            if (await fileExists(singleDocPath)) {
              // Regenerate the single doc by calling refresh
              await documentHandler.refreshSingleDoc();
            }
          }

          return {
            content: [
              {
                type: "text",
                text: `Successfully created document at ${outputPath}`,
              },
            ],
            metadata: {
              path: outputPath,
            },
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating document: ${
                  error.message || String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    }

    // Handle regular tool calls
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
      case "create_folder": {
        const parsed = CreateFolderSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for create_folder: ${parsed.error}`
          );
        }
        throw new Error("Method not implemented");
      }

      case "move_document": {
        const parsed = MoveDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for move_document: ${parsed.error}`
          );
        }
        throw new Error("Method not implemented");
      }

      case "rename_document": {
        const parsed = RenameDocumentSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for rename_document: ${parsed.error}`
          );
        }
        throw new Error("Method not implemented");
      }

      case "update_navigation_order": {
        const parsed = UpdateNavigationOrderSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for update_navigation_order: ${parsed.error}`
          );
        }
        throw new Error("Method not implemented");
      }

      case "generate_llms_doc":
        if (!useSingleDoc) {
          throw new Error("Single-doc mode is not enabled");
        }
        return await documentHandler.refreshSingleDoc();

      case "interactive_template": {
        if (!args) {
          throw new Error(
            `Invalid arguments for interactive_template: args is undefined`
          );
        }

        const template_type = args.template_type as string;
        const output_path = args.output_path as string;

        // Build a form as text content
        const formText =
          `# Create ${
            template_type.charAt(0).toUpperCase() + template_type.slice(1)
          } Documentation\n\n` +
          `Please provide the following information to create your ${template_type} documentation at '${output_path}':\n\n` +
          `- Title: [${
            template_type.charAt(0).toUpperCase() + template_type.slice(1)
          } Name]\n` +
          `- Description: [Description of this ${template_type}]\n` +
          `- Author: [Documentation Team]\n` +
          `- Tags (comma separated): [${template_type}]\n` +
          `- Status: [draft]\n\n` +
          `Once you provide this information, I'll create the document for you.`;

        return {
          content: [{ type: "text", text: formText }],
          metadata: {
            template_type,
            output_path,
          },
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error: ${error.message || String(error)}` },
      ],
      isError: true,
    };
  }
});

// Start server
(async () => {
  try {
    await ensureDocsDirectory();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // The server will be started by the SDK
    safeLog("MCP Documentation Management Service started.");
    safeLog("Using docs directory:", docsDir);
    if (useSingleDoc) {
      safeLog("Single-doc mode enabled.");
    }
    safeLog("Reading from stdin, writing results to stdout...");
  } catch (error) {
    safeLog("Fatal error running server:", error);
    process.exit(1);
  }
})();
