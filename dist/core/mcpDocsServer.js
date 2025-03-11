"use strict";
/**
 * MCP Documentation Management Server
 * This server implements the Model Context Protocol for managing documentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPDocsServer = void 0;
const docManager_js_1 = require("./docManager.js");
const docAnalyzer_js_1 = require("./docAnalyzer.js");
class MCPDocsServer {
    constructor(docsDir = "./docs", options = {}) {
        this.docManager = new docManager_js_1.DocManager(docsDir, options);
        this.docAnalyzer = new docAnalyzer_js_1.DocAnalyzer(this.docManager);
        // Log initialization info
        console.error(`MCP Documentation Service initialized with docs directory: ${docsDir}`);
        if (options.createIfNotExists) {
            console.error("Directory will be created if it doesn't exist");
        }
    }
    /**
     * Execute a query using the MCP protocol
     */
    async executeQuery(sql) {
        try {
            // Parse the SQL-like query to extract command and parameters
            const { command, params } = this.parseQuery(sql);
            // Execute the appropriate command
            switch (command) {
                case "list_files":
                    return await this.listFiles(params);
                case "list_directories":
                    return await this.listDirectories(params);
                case "get_document":
                    return await this.getDocument(params);
                case "search_documents":
                    return await this.searchDocuments(params);
                case "create_document":
                    return await this.createDocument(params);
                case "update_document":
                    return await this.updateDocument(params);
                case "delete_document":
                    return await this.deleteDocument(params);
                case "analyze_docs":
                    return await this.analyzeDocumentation(params);
                case "get_health_score":
                    return await this.getHealthScore();
                case "get_suggestions":
                    return await this.getSuggestions();
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
    /**
     * List all markdown files
     */
    async listFiles(params) {
        const directory = params.directory || "";
        const files = await this.docManager.listMarkdownFiles(directory);
        return {
            success: true,
            data: files,
        };
    }
    /**
     * List all directories
     */
    async listDirectories(params) {
        const directory = params.directory || "";
        const directories = await this.docManager.listDirectories(directory);
        return {
            success: true,
            data: directories,
        };
    }
    /**
     * Get a document by path
     */
    async getDocument(params) {
        if (!params.path) {
            return {
                success: false,
                error: "Document path is required",
            };
        }
        const document = await this.docManager.getDocument(params.path);
        if (!document) {
            return {
                success: false,
                error: `Document not found: ${params.path}`,
            };
        }
        return {
            success: true,
            data: document,
        };
    }
    /**
     * Search for documents
     */
    async searchDocuments(params) {
        const options = {
            query: params.query || "",
            tags: params.tags,
            status: params.status,
            directory: params.directory,
        };
        const results = await this.docManager.searchDocuments(options);
        return {
            success: true,
            data: results,
        };
    }
    /**
     * Create a new document
     */
    async createDocument(params) {
        if (!params.path) {
            return {
                success: false,
                error: "Document path is required",
            };
        }
        if (!params.content) {
            return {
                success: false,
                error: "Document content is required",
            };
        }
        if (!params.metadata || typeof params.metadata !== "object") {
            return {
                success: false,
                error: "Document metadata is required",
            };
        }
        const createParams = {
            path: params.path,
            content: params.content,
            metadata: params.metadata,
        };
        const success = await this.docManager.createDocument(createParams);
        return {
            success,
            data: { created: success },
        };
    }
    /**
     * Update an existing document
     */
    async updateDocument(params) {
        if (!params.path) {
            return {
                success: false,
                error: "Document path is required",
            };
        }
        const updateParams = {
            path: params.path,
            content: params.content,
            metadata: params.metadata,
        };
        const success = await this.docManager.updateDocument(updateParams);
        return {
            success,
            data: { updated: success },
        };
    }
    /**
     * Delete a document
     */
    async deleteDocument(params) {
        if (!params.path) {
            return {
                success: false,
                error: "Document path is required",
            };
        }
        const success = await this.docManager.deleteDocument(params.path);
        return {
            success,
            data: { deleted: success },
        };
    }
    /**
     * Analyze documentation
     */
    async analyzeDocumentation(params) {
        const directory = params.directory;
        const analysis = await this.docAnalyzer.analyzeDocumentation(directory);
        return {
            success: true,
            data: analysis,
        };
    }
    /**
     * Get documentation health score
     */
    async getHealthScore() {
        const score = await this.docAnalyzer.calculateHealthScore();
        return {
            success: true,
            data: { score },
        };
    }
    /**
     * Get suggestions for improving documentation
     */
    async getSuggestions() {
        const suggestions = await this.docAnalyzer.generateSuggestions();
        return {
            success: true,
            data: { suggestions },
        };
    }
}
exports.MCPDocsServer = MCPDocsServer;
//# sourceMappingURL=mcpDocsServer.js.map