"use strict";
/**
 * MCP Server Implementation
 * This file implements the Model Context Protocol server using the official SDK
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const docManager_js_1 = require("./docManager.js");
const docAnalyzer_js_1 = require("./docAnalyzer.js");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
// Process management
const LOCK_FILE = path.join(process.cwd(), ".mcp-docs-lock");
/**
 * Check if another instance is already running
 */
function isProcessRunning() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            const pid = parseInt(fs.readFileSync(LOCK_FILE, "utf8"), 10);
            // Check if the process is still running
            try {
                // Sending signal 0 doesn't actually send a signal but checks if process exists
                process.kill(pid, 0);
                return true; // Process exists
            }
            catch (e) {
                // Process doesn't exist, clean up the lock file
                fs.unlinkSync(LOCK_FILE);
                return false;
            }
        }
    }
    catch (error) {
        console.error(`Failed to check process lock: ${error}`);
    }
    return false;
}
/**
 * Create a lock file with the current process ID
 */
function createLockFile() {
    try {
        fs.writeFileSync(LOCK_FILE, process.pid.toString(), "utf8");
    }
    catch (error) {
        console.error(`Failed to create lock file: ${error}`);
    }
}
/**
 * Remove the lock file
 */
function removeLockFile() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    }
    catch (error) {
        console.error(`Failed to remove lock file: ${error}`);
    }
}
class MCPServer {
    constructor(docsDir = "./docs", options = {}) {
        this.docManager = new docManager_js_1.DocManager(docsDir, options);
        this.docAnalyzer = new docAnalyzer_js_1.DocAnalyzer(this.docManager);
        // Create the MCP server
        this.server = new mcp_js_1.McpServer({
            name: "docs-manager",
            version: "1.0.0",
        });
        // Register resources
        this.registerResources();
        // Register tools
        this.registerTools();
        // Log initialization info
        console.error(`MCP Documentation Service initialized with docs directory: ${docsDir}`);
        if (options.createIfNotExists) {
            console.error("Directory will be created if it doesn't exist");
        }
    }
    /**
     * Register all resources with the MCP server
     */
    registerResources() {
        // List files resource
        this.server.resource("list-files", new mcp_js_1.ResourceTemplate("docs://files{/directory*}", {
            list: async () => ({
                resources: [
                    {
                        name: "files",
                        uri: "docs://files",
                    },
                ],
            }),
        }), async (uri, params) => {
            try {
                const directory = params.directory
                    ? Array.isArray(params.directory)
                        ? params.directory.join("/")
                        : params.directory
                    : "";
                const files = await this.docManager.listMarkdownFiles(directory);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(files, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
        // List directories resource
        this.server.resource("list-directories", new mcp_js_1.ResourceTemplate("docs://directories{/directory*}", {
            list: async () => ({
                resources: [
                    {
                        name: "directories",
                        uri: "docs://directories",
                    },
                ],
            }),
        }), async (uri, params) => {
            try {
                const directory = params.directory
                    ? Array.isArray(params.directory)
                        ? params.directory.join("/")
                        : params.directory
                    : "";
                const directories = await this.docManager.listDirectories(directory);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(directories, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
        // Get document resource
        this.server.resource("get-document", new mcp_js_1.ResourceTemplate("docs://document/{path*}", { list: undefined }), async (uri, params) => {
            try {
                const docPath = params.path
                    ? Array.isArray(params.path)
                        ? params.path.join("/")
                        : params.path
                    : "";
                const document = await this.docManager.getDocument(docPath);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(document, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
        // Search documents resource
        this.server.resource("search-documents", new mcp_js_1.ResourceTemplate("docs://search{?query,directory,tags,status}", {
            list: undefined,
        }), async (uri, params) => {
            try {
                const searchOptions = {
                    query: typeof params.query === "string"
                        ? params.query
                        : Array.isArray(params.query)
                            ? params.query.join(" ")
                            : "",
                    directory: params.directory
                        ? typeof params.directory === "string"
                            ? params.directory
                            : params.directory.join("/")
                        : undefined,
                    tags: params.tags
                        ? Array.isArray(params.tags)
                            ? params.tags
                            : [params.tags]
                        : undefined,
                    status: params.status
                        ? typeof params.status === "string"
                            ? ["draft", "review", "published"].includes(params.status)
                                ? params.status
                                : undefined
                            : ["draft", "review", "published"].includes(params.status[0])
                                ? params.status[0]
                                : undefined
                        : undefined,
                };
                const results = await this.docManager.searchDocuments(searchOptions);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
    }
    /**
     * Register all tools with the MCP server
     */
    registerTools() {
        // Create document tool
        this.server.tool("create-document", {
            path: zod_1.z.string(),
            content: zod_1.z.string(),
            metadata: zod_1.z.object({
                title: zod_1.z.string(),
                description: zod_1.z.string().optional(),
                tags: zod_1.z.array(zod_1.z.string()).optional(),
                lastUpdated: zod_1.z.string().optional(),
                status: zod_1.z.enum(["draft", "review", "published"]).optional(),
                globs: zod_1.z.array(zod_1.z.string()).optional(),
                alwaysApply: zod_1.z.boolean().optional(),
            }),
        }, async ({ path, content, metadata }) => {
            try {
                const result = await this.docManager.createDocument({
                    path,
                    content,
                    metadata,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Update document tool
        this.server.tool("update-document", {
            path: zod_1.z.string(),
            content: zod_1.z.string().optional(),
            metadata: zod_1.z
                .object({
                title: zod_1.z.string().optional(),
                description: zod_1.z.string().optional(),
                tags: zod_1.z.array(zod_1.z.string()).optional(),
                lastUpdated: zod_1.z.string().optional(),
                status: zod_1.z.enum(["draft", "review", "published"]).optional(),
                globs: zod_1.z.array(zod_1.z.string()).optional(),
                alwaysApply: zod_1.z.boolean().optional(),
            })
                .optional(),
        }, async ({ path, content, metadata }) => {
            try {
                const result = await this.docManager.updateDocument({
                    path,
                    content,
                    metadata,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Delete document tool
        this.server.tool("delete-document", {
            path: zod_1.z.string(),
        }, async ({ path }) => {
            try {
                const result = await this.docManager.deleteDocument(path);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Analyze documentation tool
        this.server.tool("analyze-docs", {
            directory: zod_1.z.string().optional(),
        }, async ({ directory }) => {
            try {
                const result = await this.docAnalyzer.analyzeDocumentation(directory);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Get health score tool
        this.server.tool("get-health-score", {}, async () => {
            try {
                const result = await this.docAnalyzer.calculateHealthScore();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ score: result }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Get suggestions tool
        this.server.tool("get-suggestions", {}, async () => {
            try {
                const result = await this.docAnalyzer.generateSuggestions();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ suggestions: result }, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * Start the server using stdio transport
     * Checks if another instance is already running
     */
    async start(options = {}) {
        // Check if another instance is running
        if (isProcessRunning() && !options.forceStart) {
            console.error("Another MCP Documentation Service instance is already running.");
            console.error("Use --force to start anyway and kill the existing instance.");
            process.exit(1);
        }
        // If we're forcing a start, we'll create a new lock file
        createLockFile();
        // Set up cleanup handlers for process exit
        const cleanup = () => {
            removeLockFile();
        };
        // Register cleanup handlers for common exit signals
        process.on("exit", cleanup);
        process.on("SIGINT", () => {
            cleanup();
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            cleanup();
            process.exit(0);
        });
        // Start with stdio transport
        const transport = new stdio_js_1.StdioServerTransport();
        try {
            await this.server.connect(transport);
        }
        catch (error) {
            console.error(`Error connecting to transport: ${error}`);
            cleanup();
            process.exit(1);
        }
    }
    /**
     * Legacy method to execute a query using the old format
     * This is kept for backward compatibility
     */
    async executeQuery(sql) {
        try {
            // Parse the SQL-like query to extract command and parameters
            const { command, params } = this.parseQuery(sql);
            // Map old commands to new MCP resources and tools
            switch (command) {
                case "list_files": {
                    const directory = params.directory || "";
                    const files = await this.docManager.listMarkdownFiles(directory);
                    return {
                        success: true,
                        data: files,
                    };
                }
                case "list_directories": {
                    const directory = params.directory || "";
                    const directories = await this.docManager.listDirectories(directory);
                    return {
                        success: true,
                        data: directories,
                    };
                }
                case "get_document": {
                    const document = await this.docManager.getDocument(params.path);
                    return {
                        success: true,
                        data: document,
                    };
                }
                case "search_documents": {
                    const searchOptions = {
                        query: typeof params.query === "string" ? params.query : "",
                        directory: params.directory,
                        tags: params.tags,
                        status: params.status &&
                            typeof params.status === "string" &&
                            ["draft", "review", "published"].includes(params.status)
                            ? params.status
                            : undefined,
                    };
                    const results = await this.docManager.searchDocuments(searchOptions);
                    return {
                        success: true,
                        data: results,
                    };
                }
                case "create_document": {
                    const result = await this.docManager.createDocument({
                        path: params.path,
                        content: params.content,
                        metadata: params.metadata || { title: "Untitled Document" },
                    });
                    return {
                        success: true,
                        data: result,
                    };
                }
                case "update_document": {
                    const result = await this.docManager.updateDocument({
                        path: params.path,
                        content: params.content,
                        metadata: params.metadata,
                    });
                    return {
                        success: true,
                        data: result,
                    };
                }
                case "delete_document": {
                    const result = await this.docManager.deleteDocument(params.path);
                    return {
                        success: true,
                        data: result,
                    };
                }
                case "analyze_docs": {
                    const result = await this.docAnalyzer.analyzeDocumentation(params.directory);
                    return {
                        success: true,
                        data: result,
                    };
                }
                case "get_health_score": {
                    const result = await this.docAnalyzer.calculateHealthScore();
                    return {
                        success: true,
                        data: { score: result },
                    };
                }
                case "get_suggestions": {
                    const result = await this.docAnalyzer.generateSuggestions();
                    return {
                        success: true,
                        data: { suggestions: result },
                    };
                }
                default:
                    return {
                        success: false,
                        error: `Unknown command: ${command}`,
                    };
            }
        }
        catch (error) {
            console.error("Error executing query:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Parse a query string into command and parameters
     * This is used for backward compatibility with the old query format
     */
    parseQuery(query) {
        // Default to empty parameters
        const params = {};
        // Handle simple command syntax
        if (query.indexOf("(") === -1) {
            return { command: query.trim(), params };
        }
        // Extract command name
        const commandMatch = query.match(/^\s*(\w+)\s*\(/);
        if (!commandMatch) {
            throw new Error(`Invalid query format: ${query}`);
        }
        const command = commandMatch[1];
        // Extract parameters between parentheses
        const paramsMatch = query.match(/\(\s*(.*)\s*\)/s);
        if (!paramsMatch) {
            return { command, params };
        }
        // Parse parameter string
        const paramsStr = paramsMatch[1];
        // Handle JSON object parameters
        if (paramsStr.trim().startsWith("{") && paramsStr.trim().endsWith("}")) {
            try {
                return { command, params: JSON.parse(paramsStr) };
            }
            catch (e) {
                throw new Error(`Invalid JSON parameters: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        // Parse key=value parameters
        let currentKey = "";
        let currentValue = "";
        let inQuotes = false;
        let inObject = false;
        let inArray = false;
        let objectDepth = 0;
        let arrayDepth = 0;
        for (let i = 0; i < paramsStr.length; i++) {
            const char = paramsStr[i];
            const nextChar = paramsStr[i + 1] || "";
            // Handle quotes
            if (char === '"' && paramsStr[i - 1] !== "\\") {
                inQuotes = !inQuotes;
                currentValue += char;
                continue;
            }
            // Handle objects
            if (char === "{" && !inQuotes) {
                inObject = true;
                objectDepth++;
                currentValue += char;
                continue;
            }
            if (char === "}" && !inQuotes) {
                objectDepth--;
                if (objectDepth === 0)
                    inObject = false;
                currentValue += char;
                continue;
            }
            // Handle arrays
            if (char === "[" && !inQuotes) {
                inArray = true;
                arrayDepth++;
                currentValue += char;
                continue;
            }
            if (char === "]" && !inQuotes) {
                arrayDepth--;
                if (arrayDepth === 0)
                    inArray = false;
                currentValue += char;
                continue;
            }
            // Handle key=value separator
            if (char === "=" &&
                !inQuotes &&
                !inObject &&
                !inArray &&
                currentKey === "") {
                currentKey = currentValue.trim();
                currentValue = "";
                continue;
            }
            // Handle parameter separator
            if (char === "," && !inQuotes && !inObject && !inArray) {
                if (currentKey && currentValue) {
                    // Try to parse the value
                    try {
                        if (currentValue.startsWith('"') && currentValue.endsWith('"')) {
                            // String value
                            params[currentKey] = JSON.parse(currentValue);
                        }
                        else if (currentValue.toLowerCase() === "true" ||
                            currentValue.toLowerCase() === "false") {
                            // Boolean value
                            params[currentKey] = currentValue.toLowerCase() === "true";
                        }
                        else if (!isNaN(Number(currentValue))) {
                            // Number value
                            params[currentKey] = Number(currentValue);
                        }
                        else if (currentValue.startsWith("[") &&
                            currentValue.endsWith("]")) {
                            // Array value
                            params[currentKey] = JSON.parse(currentValue);
                        }
                        else if (currentValue.startsWith("{") &&
                            currentValue.endsWith("}")) {
                            // Object value
                            params[currentKey] = JSON.parse(currentValue);
                        }
                        else {
                            // Everything else as string
                            params[currentKey] = currentValue;
                        }
                    }
                    catch (e) {
                        // If parsing fails, use as string
                        params[currentKey] = currentValue;
                    }
                }
                currentKey = "";
                currentValue = "";
                continue;
            }
            // Add character to current value
            currentValue += char;
        }
        // Handle the last parameter
        if (currentKey && currentValue) {
            try {
                if (currentValue.startsWith('"') && currentValue.endsWith('"')) {
                    // String value
                    params[currentKey] = JSON.parse(currentValue);
                }
                else if (currentValue.toLowerCase() === "true" ||
                    currentValue.toLowerCase() === "false") {
                    // Boolean value
                    params[currentKey] = currentValue.toLowerCase() === "true";
                }
                else if (!isNaN(Number(currentValue))) {
                    // Number value
                    params[currentKey] = Number(currentValue);
                }
                else if (currentValue.startsWith("[") && currentValue.endsWith("]")) {
                    // Array value
                    params[currentKey] = JSON.parse(currentValue);
                }
                else if (currentValue.startsWith("{") && currentValue.endsWith("}")) {
                    // Object value
                    params[currentKey] = JSON.parse(currentValue);
                }
                else {
                    // Everything else as string
                    params[currentKey] = currentValue;
                }
            }
            catch (e) {
                // If parsing fails, use as string
                params[currentKey] = currentValue;
            }
        }
        return { command, params };
    }
}
exports.MCPServer = MCPServer;
//# sourceMappingURL=mcpServer.js.map