#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import matter from "gray-matter";

// Import utility functions
import { normalizePath, expandHome } from "./utils/path.js";

// Import handlers
import * as FileHandlers from "./handlers/file.js";
import * as DocsHandlers from "./handlers/docs.js";

// Import schemas
import * as ToolSchemas from "./schemas/tools.js";

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: mcp-server-filesystem <allowed-directory> [additional-directories...]"
  );
  process.exit(1);
}

// Store allowed directories in normalized form
const allowedDirectories = args.map((dir) =>
  normalizePath(path.resolve(expandHome(dir)))
);

// Validate that all directories exist and are accessible
await Promise.all(
  args.map(async (dir) => {
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        console.error(`Error: ${dir} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error accessing directory ${dir}:`, error);
      process.exit(1);
    }
  })
);

// Create server
const server = new Server(
  {
    name: "secure-filesystem-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const tools = [
  // File operations
  {
    name: "read_file",
    description: "Read the contents of a file",
    schema: ToolSchemas.ReadFileSchema,
    handler: async (args: z.infer<typeof ToolSchemas.ReadFileSchema>) => {
      return await FileHandlers.readFile(args.path, allowedDirectories);
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    schema: ToolSchemas.WriteFileSchema,
    handler: async (args: z.infer<typeof ToolSchemas.WriteFileSchema>) => {
      return await FileHandlers.writeFile(
        args.path,
        args.content,
        allowedDirectories
      );
    },
  },
  {
    name: "list_files",
    description: "List files in a directory",
    schema: ToolSchemas.ListFilesSchema,
    handler: async (args: z.infer<typeof ToolSchemas.ListFilesSchema>) => {
      return await FileHandlers.listFiles(args.path, allowedDirectories);
    },
  },
  {
    name: "get_file_info",
    description: "Get information about a file",
    schema: ToolSchemas.GetFileInfoSchema,
    handler: async (args: z.infer<typeof ToolSchemas.GetFileInfoSchema>) => {
      return await FileHandlers.getFileInfo(args.path, allowedDirectories);
    },
  },
  {
    name: "search_files",
    description: "Search for files matching a pattern",
    schema: ToolSchemas.SearchFilesSchema,
    handler: async (args: z.infer<typeof ToolSchemas.SearchFilesSchema>) => {
      return await FileHandlers.searchForFiles(
        args.rootPath,
        args.pattern,
        args.excludePatterns || [],
        allowedDirectories
      );
    },
  },
  {
    name: "edit_file",
    description: "Apply edits to a file",
    schema: ToolSchemas.EditFileSchema,
    handler: async (args: z.infer<typeof ToolSchemas.EditFileSchema>) => {
      return await FileHandlers.editFile(
        args.path,
        args.edits,
        allowedDirectories
      );
    },
  },
  {
    name: "get_directory_tree",
    description: "Get the directory structure as a tree",
    schema: ToolSchemas.GetDirectoryTreeSchema,
    handler: async (
      args: z.infer<typeof ToolSchemas.GetDirectoryTreeSchema>
    ) => {
      return await FileHandlers.getDirectoryTree(args.path, allowedDirectories);
    },
  },

  // Documentation operations
  {
    name: "read_document",
    description:
      "Read a markdown document and extract its content and metadata",
    schema: ToolSchemas.ReadDocumentSchema,
    handler: async (args: z.infer<typeof ToolSchemas.ReadDocumentSchema>) => {
      return await DocsHandlers.readDocument(args.path, allowedDirectories);
    },
  },
  {
    name: "list_documents",
    description: "List all markdown documents in a directory",
    schema: ToolSchemas.ListDocumentsSchema,
    handler: async (args: z.infer<typeof ToolSchemas.ListDocumentsSchema>) => {
      return await DocsHandlers.listDocuments(
        args.basePath || "",
        allowedDirectories
      );
    },
  },
  {
    name: "get_structure",
    description: "Get the structure of the documentation directory",
    schema: ToolSchemas.GetStructureSchema,
    handler: async (args: z.infer<typeof ToolSchemas.GetStructureSchema>) => {
      return await DocsHandlers.getStructure(
        args.basePath || "",
        allowedDirectories
      );
    },
  },
  {
    name: "get_navigation",
    description: "Get the navigation structure for the documentation",
    schema: ToolSchemas.GetNavigationSchema,
    handler: async (args: z.infer<typeof ToolSchemas.GetNavigationSchema>) => {
      return await DocsHandlers.getNavigation(
        args.basePath || "",
        allowedDirectories
      );
    },
  },
];

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
    const result = await tool.handler(parsedArgs as any);

    return { result };
  } catch (error: any) {
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
