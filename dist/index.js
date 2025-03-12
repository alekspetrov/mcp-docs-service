#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { zodToJsonSchema } from "zod-to-json-schema";
import matter from "gray-matter";
// Import utility functions
import { normalizePath, expandHome, validatePath } from "./utils/path.js";
// Import handlers
import * as DocsHandlers from "./handlers/docs.js";
// Import schemas
import * as ToolSchemas from "./schemas/tools.js";
// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: mcp-server-filesystem <allowed-directory> [additional-directories...]");
    process.exit(1);
}
// Store allowed directories in normalized form
const allowedDirectories = args.map((dir) => normalizePath(path.resolve(expandHome(dir))));
// Validate that all directories exist and are accessible
await Promise.all(args.map(async (dir) => {
    try {
        const stats = await fs.stat(dir);
        if (!stats.isDirectory()) {
            console.error(`Error: ${dir} is not a directory`);
            process.exit(1);
        }
    }
    catch (error) {
        console.error(`Error accessing directory ${dir}:`, error);
        process.exit(1);
    }
}));
// Create server
const server = new Server({
    name: "secure-filesystem-server",
    version: "0.2.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Define tools
// ===================================================================
// DOCUMENTATION TOOLS
// ===================================================================
// These tools are specifically designed for working with documentation
// files (markdown with frontmatter)
const documentationTools = [
    // Read document - reads a markdown document and extracts its content and metadata
    {
        name: "read_document",
        description: "Read a markdown document and extract its content and metadata",
        schema: ToolSchemas.ReadDocumentSchema,
        handler: async (args) => {
            return await DocsHandlers.readDocument(args.path, allowedDirectories);
        },
    },
    // List documents - lists all markdown documents in a directory
    {
        name: "list_documents",
        description: "List all markdown documents in a directory",
        schema: ToolSchemas.ListDocumentsSchema,
        handler: async (args) => {
            return await DocsHandlers.listDocuments(args.basePath || "", allowedDirectories);
        },
    },
    // Get structure - gets the structure of the documentation directory
    {
        name: "get_structure",
        description: "Get the structure of the documentation directory",
        schema: ToolSchemas.GetStructureSchema,
        handler: async (args) => {
            return await DocsHandlers.getStructure(args.basePath || "", allowedDirectories);
        },
    },
    // Get navigation - gets the navigation structure for the documentation
    {
        name: "get_navigation",
        description: "Get the navigation structure for the documentation",
        schema: ToolSchemas.GetNavigationSchema,
        handler: async (args) => {
            return await DocsHandlers.getNavigation(args.basePath || "", allowedDirectories);
        },
    },
    // Get docs knowledge base - creates a comprehensive knowledge base of documentation
    {
        name: "get_docs_knowledge_base",
        description: "Create a comprehensive knowledge base of documentation for LLM context",
        schema: ToolSchemas.GetDocsKnowledgeBaseSchema,
        handler: async (args) => {
            try {
                // First get the navigation structure
                const navResult = await DocsHandlers.getNavigation(args.basePath || "", allowedDirectories);
                if (navResult.isError) {
                    return navResult;
                }
                // Get all documents
                const docsResult = await DocsHandlers.listDocuments(args.basePath || "", allowedDirectories);
                if (docsResult.isError) {
                    return docsResult;
                }
                const documents = docsResult.metadata?.documents || [];
                const navigation = navResult.metadata?.navigation || [];
                // Create a map of path to document for quick lookup
                const documentMap = new Map();
                documents.forEach((doc) => {
                    documentMap.set(doc.path, doc);
                });
                // Create knowledge base structure
                const knowledgeBase = {
                    navigation,
                    documents: [],
                    categories: {},
                    tags: {},
                };
                // Process documents to extract summaries if requested
                const includeSummaries = args.includeSummaries !== false; // Default to true
                const maxSummaryLength = args.maxSummaryLength || 500;
                // Process all documents
                for (const doc of documents) {
                    // Create document entry with metadata
                    const docEntry = {
                        path: doc.path,
                        name: doc.name,
                        metadata: doc.metadata || {},
                    };
                    // Add summary if requested
                    if (includeSummaries) {
                        try {
                            const docContent = await DocsHandlers.readDocument(doc.path, allowedDirectories);
                            if (!docContent.isError && docContent.metadata?.content) {
                                // Extract a summary (first few paragraphs)
                                const content = docContent.metadata.content;
                                const paragraphs = content.split("\n\n");
                                let summary = "";
                                // Get first few paragraphs up to maxSummaryLength
                                for (const para of paragraphs) {
                                    if (summary.length + para.length <= maxSummaryLength) {
                                        summary += para + "\n\n";
                                    }
                                    else {
                                        // Add partial paragraph to reach maxSummaryLength
                                        const remainingLength = maxSummaryLength - summary.length;
                                        if (remainingLength > 0) {
                                            summary += para.substring(0, remainingLength) + "...";
                                        }
                                        break;
                                    }
                                }
                                docEntry.summary = summary.trim();
                            }
                        }
                        catch (error) {
                            // Skip summary if there's an error
                            docEntry.summary = "Error generating summary";
                        }
                    }
                    // Add to knowledge base
                    knowledgeBase.documents.push(docEntry);
                    // Organize by categories (based on directory structure)
                    const dirPath = path.dirname(doc.path);
                    if (!knowledgeBase.categories[dirPath]) {
                        knowledgeBase.categories[dirPath] = [];
                    }
                    knowledgeBase.categories[dirPath].push(docEntry);
                    // Organize by tags
                    if (doc.metadata?.tags) {
                        for (const tag of doc.metadata.tags) {
                            if (!knowledgeBase.tags[tag]) {
                                knowledgeBase.tags[tag] = [];
                            }
                            knowledgeBase.tags[tag].push(docEntry);
                        }
                    }
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `Generated knowledge base with ${knowledgeBase.documents.length} documents`,
                        },
                    ],
                    metadata: {
                        knowledgeBase,
                    },
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error generating knowledge base: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    },
    // Write document - writes content to a markdown document with frontmatter
    {
        name: "write_document",
        description: "Write content to a markdown document with frontmatter",
        schema: ToolSchemas.WriteDocumentSchema,
        handler: async (args) => {
            try {
                const normalizedPath = await validatePath(args.path, allowedDirectories);
                // Convert metadata to frontmatter and combine with content
                const frontmatter = args.metadata
                    ? matter.stringify(args.content, args.metadata)
                    : args.content;
                // Ensure the directory exists
                const dirPath = path.dirname(normalizedPath);
                await fs.mkdir(dirPath, { recursive: true });
                // Write the file
                await fs.writeFile(normalizedPath, frontmatter);
                return {
                    content: [{ type: "text", text: "Document written successfully" }],
                    metadata: {
                        path: args.path,
                    },
                };
            }
            catch (error) {
                return {
                    content: [
                        { type: "text", text: `Error writing document: ${error.message}` },
                    ],
                    isError: true,
                };
            }
        },
    },
    // Edit document - applies edits to a markdown document while preserving frontmatter
    {
        name: "edit_document",
        description: "Apply edits to a markdown document while preserving frontmatter",
        schema: ToolSchemas.EditDocumentSchema,
        handler: async (args) => {
            try {
                // First read the document to get its current content and metadata
                const docResult = await DocsHandlers.readDocument(args.path, allowedDirectories);
                if (docResult.isError) {
                    return docResult;
                }
                const normalizedPath = await validatePath(args.path, allowedDirectories);
                // Read the current content
                const content = await fs.readFile(normalizedPath, "utf-8");
                // Apply edits
                let newContent = content;
                let appliedEdits = 0;
                for (const edit of args.edits) {
                    if (newContent.includes(edit.oldText)) {
                        newContent = newContent.replace(edit.oldText, edit.newText);
                        appliedEdits++;
                    }
                }
                // Write the updated content
                await fs.writeFile(normalizedPath, newContent);
                return {
                    content: [{ type: "text", text: "Document edited successfully" }],
                    metadata: {
                        path: args.path,
                        appliedEdits,
                    },
                };
            }
            catch (error) {
                return {
                    content: [
                        { type: "text", text: `Error editing document: ${error.message}` },
                    ],
                    isError: true,
                };
            }
        },
    },
    // Delete document - deletes a markdown document
    {
        name: "delete_document",
        description: "Delete a markdown document",
        schema: ToolSchemas.DeleteDocumentSchema,
        handler: async (args) => {
            try {
                const normalizedPath = await validatePath(args.path, allowedDirectories);
                // Check if the file exists and is a markdown file
                const stats = await fs.stat(normalizedPath);
                if (!stats.isFile() || !normalizedPath.endsWith(".md")) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error: ${args.path} is not a markdown document`,
                            },
                        ],
                        isError: true,
                    };
                }
                // Delete the file
                await fs.unlink(normalizedPath);
                return {
                    content: [{ type: "text", text: "Document deleted successfully" }],
                    metadata: {
                        path: args.path,
                    },
                };
            }
            catch (error) {
                return {
                    content: [
                        { type: "text", text: `Error deleting document: ${error.message}` },
                    ],
                    isError: true,
                };
            }
        },
    },
    // Search documents - searches for markdown documents matching criteria
    {
        name: "search_documents",
        description: "Search for markdown documents matching criteria",
        schema: ToolSchemas.SearchDocumentsSchema,
        handler: async (args) => {
            try {
                // Get the list of documents first
                const listResult = await DocsHandlers.listDocuments(args.basePath || "", allowedDirectories);
                if (listResult.isError) {
                    return listResult;
                }
                let documents = listResult.metadata?.documents || [];
                // Filter by query if provided
                if (args.query) {
                    documents = documents.filter((doc) => {
                        // Check if query matches document path, name, or metadata
                        const docString = JSON.stringify(doc).toLowerCase();
                        return docString.includes(args.query.toLowerCase());
                    });
                }
                // Filter by tags if provided
                if (args.tags && args.tags.length > 0) {
                    documents = documents.filter((doc) => {
                        const docTags = doc.metadata?.tags || [];
                        return args.tags.some((tag) => docTags.includes(tag));
                    });
                }
                // Filter by status if provided
                if (args.status) {
                    documents = documents.filter((doc) => doc.metadata?.status === args.status);
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${documents.length} matching documents`,
                        },
                    ],
                    metadata: {
                        documents,
                    },
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error searching documents: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    },
];
// Combine all tools
const tools = [...documentationTools];
// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: zodToJsonSchema(tool.schema),
        })),
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // Find the requested tool
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
        return {
            result: {
                content: [
                    {
                        type: "text",
                        text: `Tool not found: ${name}`,
                    },
                ],
                isError: true,
            },
        };
    }
    try {
        // Parse and validate arguments
        const parsedArgs = tool.schema.parse(args);
        // Call the tool handler with the appropriate type
        const result = await tool.handler(parsedArgs);
        return { result };
    }
    catch (error) {
        return {
            result: {
                content: [
                    {
                        type: "text",
                        text: `Error calling tool ${name}: ${error.message}`,
                    },
                ],
                isError: true,
            },
        };
    }
});
// Connect to transport and start the server
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map