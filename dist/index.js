#!/usr/bin/env node
/**
 * MCP Docs Service
 *
 * A Model Context Protocol implementation for documentation management.
 * This service provides tools for reading, writing, and managing markdown documentation.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { zodToJsonSchema } from "zod-to-json-schema";
// Import our utilities
import { safeLog, normalizePath } from "./utils/index.js";
// Import schemas
import { ReadDocumentSchema, WriteDocumentSchema, EditDocumentSchema, ListDocumentsSchema, SearchDocumentsSchema, CheckDocumentationHealthSchema, } from "./schemas/index.js";
// Import handlers
import { DocumentHandler, NavigationHandler, HealthCheckHandler, } from "./handlers/index.js";
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
    }
    else if (args[i] === "--create-dir") {
        createDir = true;
    }
    else if (args[i] === "--health-check") {
        runHealthCheck = true;
    }
    else if (!args[i].startsWith("--")) {
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
    }
    catch (error) {
        // Create directory if it doesn't exist and --create-dir is specified
        if (createDir) {
            try {
                await fs.mkdir(docsDir, { recursive: true });
                safeLog(`Created docs directory: ${docsDir}`);
                // Create a sample README.md
                const readmePath = path.join(docsDir, "README.md");
                try {
                    await fs.access(readmePath);
                }
                catch {
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
            }
            catch (error) {
                safeLog(`Error creating docs directory: ${error}`);
                process.exit(1);
            }
        }
        else {
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
const server = new Server({
    name: "mcp-docs-service",
    version: "0.3.10",
}, {
    capabilities: {
        tools: {},
    },
});
// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "mcp_docs_manager_read_document",
                description: "Read a markdown document from the docs directory. Returns the document content " +
                    "including frontmatter. Use this tool when you need to examine the contents of a " +
                    "single document.",
                inputSchema: zodToJsonSchema(ReadDocumentSchema),
            },
            {
                name: "mcp_docs_manager_write_document",
                description: "Create a new markdown document or completely overwrite an existing document with new content. " +
                    "Use with caution as it will overwrite existing documents without warning. " +
                    "Can create parent directories if they don't exist.",
                inputSchema: zodToJsonSchema(WriteDocumentSchema),
            },
            {
                name: "mcp_docs_manager_edit_document",
                description: "Make line-based edits to a markdown document. Each edit replaces exact line sequences " +
                    "with new content. Returns a git-style diff showing the changes made.",
                inputSchema: zodToJsonSchema(EditDocumentSchema),
            },
            {
                name: "mcp_docs_manager_list_documents",
                description: "List all markdown documents in the docs directory or a subdirectory. " +
                    "Returns the relative paths to all documents.",
                inputSchema: zodToJsonSchema(ListDocumentsSchema),
            },
            {
                name: "mcp_docs_manager_search_documents",
                description: "Search for markdown documents containing specific text in their content or frontmatter. " +
                    "Returns the relative paths to matching documents.",
                inputSchema: zodToJsonSchema(SearchDocumentsSchema),
            },
            {
                name: "mcp_docs_manager_generate_navigation",
                description: "Generate a navigation structure from the markdown documents in the docs directory. " +
                    "Returns a JSON structure that can be used for navigation menus.",
                inputSchema: zodToJsonSchema(ListDocumentsSchema),
            },
            {
                name: "mcp_docs_manager_check_documentation_health",
                description: "Check the health of the documentation by analyzing frontmatter, links, and navigation. " +
                    "Returns a report with issues and a health score.",
                inputSchema: zodToJsonSchema(CheckDocumentationHealthSchema),
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "mcp_docs_manager_read_document": {
                const parsed = ReadDocumentSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for read_document: ${parsed.error}`);
                }
                return await documentHandler.readDocument(parsed.data.path);
            }
            case "mcp_docs_manager_write_document": {
                const parsed = WriteDocumentSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for write_document: ${parsed.error}`);
                }
                return await documentHandler.writeDocument(parsed.data.path, parsed.data.content, parsed.data.createDirectories);
            }
            case "mcp_docs_manager_edit_document": {
                const parsed = EditDocumentSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for edit_document: ${parsed.error}`);
                }
                return await documentHandler.editDocument(parsed.data.path, parsed.data.edits, parsed.data.dryRun);
            }
            case "mcp_docs_manager_list_documents": {
                const parsed = ListDocumentsSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for list_documents: ${parsed.error}`);
                }
                return await documentHandler.listDocuments(parsed.data.basePath, parsed.data.recursive);
            }
            case "mcp_docs_manager_search_documents": {
                const parsed = SearchDocumentsSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for search_documents: ${parsed.error}`);
                }
                return await documentHandler.searchDocuments(parsed.data.query, parsed.data.basePath);
            }
            case "mcp_docs_manager_generate_navigation": {
                const parsed = ListDocumentsSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for generate_navigation: ${parsed.error}`);
                }
                return await navigationHandler.generateNavigation(parsed.data.basePath);
            }
            case "mcp_docs_manager_check_documentation_health": {
                const parsed = CheckDocumentationHealthSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for check_documentation_health: ${parsed.error}`);
                }
                return await healthCheckHandler.checkDocumentationHealth(parsed.data.basePath);
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
// Run health check if requested
if (runHealthCheck) {
    (async () => {
        try {
            await ensureDocsDirectory();
            const healthResponse = await healthCheckHandler.checkDocumentationHealth("");
            if (healthResponse.isError) {
                safeLog(`Error running health check: ${healthResponse.content[0].text}`);
                process.exit(1);
            }
            safeLog(healthResponse.content[0].text);
            process.exit(0);
        }
        catch (error) {
            safeLog(`Error running health check: ${error}`);
            process.exit(1);
        }
    })();
}
else {
    // Start server
    (async () => {
        try {
            await ensureDocsDirectory();
            const transport = new StdioServerTransport();
            await server.connect(transport);
            safeLog("MCP Documentation Management Service started.");
            safeLog("Using docs directory:", docsDir);
            safeLog("Reading from stdin, writing results to stdout...");
        }
        catch (error) {
            safeLog("Fatal error running server:", error);
            process.exit(1);
        }
    })();
}
