import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import yaml from "js-yaml";
// Schema definitions
const ListFilesArgsSchema = z
    .object({
    directory: z.string().optional().default(""),
})
    .optional()
    .default({});
const ListDirectoriesArgsSchema = z
    .object({
    directory: z.string().optional().default(""),
})
    .optional()
    .default({});
const GetDocumentArgsSchema = z.object({
    path: z.string(),
});
const CreateDocumentArgsSchema = z.object({
    path: z.string(),
    content: z.string(),
    metadata: z.record(z.any()).optional().default({}),
});
const UpdateDocumentArgsSchema = z.object({
    path: z.string(),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});
const DeleteDocumentArgsSchema = z.object({
    path: z.string(),
});
const SearchDocumentsArgsSchema = z.object({
    query: z.string(),
    directory: z.string().optional().default(""),
    tags: z.array(z.string()).optional(),
    status: z.string().optional(),
});
const AnalyzeDocsArgsSchema = z
    .object({
    directory: z.string().optional().default(""),
})
    .optional()
    .default({});
const GetHealthScoreArgsSchema = z.object({}).optional().default({});
const GetSuggestionsArgsSchema = z.object({}).optional().default({});
/**
 * Main MCP Documentation Server class
 */
export class MCPDocsServer {
    /**
     * Create a new MCP Documentation Server
     *
     * @param docsDir - The directory to store documentation in
     * @param options - Configuration options
     */
    constructor(docsDir = "./docs", options = {}) {
        this.options = options;
        this.docsDir = docsDir;
        this.fileExtensions = options.fileExtensions || [".md", ".mdx"];
        this.server = new Server({
            name: "docs-management-server",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    /**
     * Set up the request handlers for the server
     */
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "list_files",
                        description: "List all documentation files in the specified directory. " +
                            "Returns the relative paths to markdown files. " +
                            "If no directory is specified, lists all files in the root docs directory.",
                        inputSchema: zodToJsonSchema(ListFilesArgsSchema),
                    },
                    {
                        name: "list_directories",
                        description: "List all directories in the specified directory. " +
                            "Returns the relative paths to directories. " +
                            "If no directory is specified, lists all directories in the root docs directory.",
                        inputSchema: zodToJsonSchema(ListDirectoriesArgsSchema),
                    },
                    {
                        name: "get_document",
                        description: "Get a document's content and metadata. " +
                            "Returns the document content and any metadata in the frontmatter. " +
                            "Path should be relative to the docs directory.",
                        inputSchema: zodToJsonSchema(GetDocumentArgsSchema),
                    },
                    {
                        name: "create_document",
                        description: "Create a new document with the specified content and metadata. " +
                            "Metadata will be stored as YAML frontmatter. " +
                            "Path should be relative to the docs directory.",
                        inputSchema: zodToJsonSchema(CreateDocumentArgsSchema),
                    },
                    {
                        name: "update_document",
                        description: "Update an existing document with new content and/or metadata. " +
                            "If only content or metadata is provided, only that part will be updated. " +
                            "Path should be relative to the docs directory.",
                        inputSchema: zodToJsonSchema(UpdateDocumentArgsSchema),
                    },
                    {
                        name: "delete_document",
                        description: "Delete a document. " +
                            "Path should be relative to the docs directory.",
                        inputSchema: zodToJsonSchema(DeleteDocumentArgsSchema),
                    },
                    {
                        name: "search_documents",
                        description: "Search documents for the specified query. " +
                            "Returns documents that match the query based on content and metadata. " +
                            "Can filter by directory, tags, and status.",
                        inputSchema: zodToJsonSchema(SearchDocumentsArgsSchema),
                    },
                    {
                        name: "analyze_docs",
                        description: "Analyze documentation health in the specified directory. " +
                            "Returns information about missing documentation, incomplete docs, etc. " +
                            "If no directory is specified, analyzes all docs.",
                        inputSchema: zodToJsonSchema(AnalyzeDocsArgsSchema),
                    },
                    {
                        name: "get_health_score",
                        description: "Get overall documentation health score. " +
                            "Returns a score between 0 and 100 indicating how complete and up-to-date the documentation is.",
                        inputSchema: zodToJsonSchema(GetHealthScoreArgsSchema),
                    },
                    {
                        name: "get_suggestions",
                        description: "Get suggestions for improving documentation. " +
                            "Returns a list of actionable suggestions to improve documentation quality and coverage.",
                        inputSchema: zodToJsonSchema(GetSuggestionsArgsSchema),
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // Ensure docs directory exists
                await this.ensureDocsDir();
                const { name, arguments: args } = request.params;
                // Execute the appropriate handler
                const result = await this.executeHandler(name, args);
                return {
                    content: [{ type: "text", text: result }],
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Error: ${errorMessage}` }],
                    isError: true,
                };
            }
        });
    }
    /**
     * Execute a handler for the specified tool
     *
     * @param name - The tool name
     * @param args - The tool arguments
     * @returns The result of the tool execution
     */
    async executeHandler(name, args) {
        switch (name) {
            case "list_files":
                return this.handleListFiles(args);
            case "list_directories":
                return this.handleListDirectories(args);
            case "get_document":
                return this.handleGetDocument(args);
            case "create_document":
                return this.handleCreateDocument(args);
            case "update_document":
                return this.handleUpdateDocument(args);
            case "delete_document":
                return this.handleDeleteDocument(args);
            case "search_documents":
                return this.handleSearchDocuments(args);
            case "analyze_docs":
                return this.handleAnalyzeDocs(args);
            case "get_health_score":
                return this.handleGetHealthScore(args);
            case "get_suggestions":
                return this.handleGetSuggestions(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    /**
     * Ensure the docs directory exists
     */
    async ensureDocsDir() {
        try {
            await fs.access(this.docsDir);
        }
        catch (error) {
            if (this.options.createIfNotExists) {
                await fs.mkdir(this.docsDir, { recursive: true });
            }
            else {
                throw new Error(`Docs directory does not exist: ${this.docsDir}. Use --create-dir to create it.`);
            }
        }
    }
    /**
     * Get the absolute path to a file or directory
     *
     * @param relativePath - The path relative to the docs directory
     * @returns The absolute path
     */
    getAbsolutePath(relativePath) {
        return path.join(this.docsDir, relativePath);
    }
    /**
     * Parse a document with frontmatter
     *
     * @param content - The document content
     * @returns The parsed document with metadata
     */
    parseDocument(content) {
        // Check if the document has frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
        if (frontmatterMatch) {
            try {
                const frontmatter = frontmatterMatch[1];
                const documentContent = frontmatterMatch[2];
                const metadata = yaml.load(frontmatter);
                return {
                    content: documentContent,
                    metadata: metadata || {},
                };
            }
            catch (error) {
                console.error("Error parsing frontmatter:", error);
                return {
                    content,
                    metadata: {},
                };
            }
        }
        return {
            content,
            metadata: {},
        };
    }
    /**
     * Serialize a document with metadata to a string
     *
     * @param content - The document content
     * @param metadata - The document metadata
     * @returns The serialized document with frontmatter
     */
    serializeDocument(content, metadata) {
        // Skip frontmatter if there's no metadata
        if (Object.keys(metadata).length === 0) {
            return content;
        }
        const frontmatter = yaml.dump(metadata);
        return `---\n${frontmatter}---\n\n${content}`;
    }
    /**
     * Get all files in a directory recursively
     *
     * @param dir - The directory to search
     * @param basePath - The base path to use for relative paths
     * @returns A list of files
     */
    async getAllFiles(dir, basePath = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const relativePath = path.join(basePath, entry.name);
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const subDirFiles = await this.getAllFiles(fullPath, relativePath);
                files.push(...subDirFiles);
            }
            else if (this.fileExtensions.some((ext) => entry.name.endsWith(ext))) {
                files.push(relativePath);
            }
        }
        return files;
    }
    /**
     * Get all directories in a directory
     *
     * @param dir - The directory to search
     * @param basePath - The base path to use for relative paths
     * @returns A list of directories
     */
    async getAllDirectories(dir, basePath = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const directories = [];
        for (const entry of entries) {
            const relativePath = path.join(basePath, entry.name);
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                directories.push(relativePath);
                const subDirs = await this.getAllDirectories(fullPath, relativePath);
                directories.push(...subDirs);
            }
        }
        return directories;
    }
    /**
     * Read a document and its metadata
     *
     * @param docPath - The path to the document
     * @returns The document with metadata
     */
    async readDocument(docPath) {
        const fullPath = this.getAbsolutePath(docPath);
        const content = await fs.readFile(fullPath, "utf-8");
        const { content: docContent, metadata } = this.parseDocument(content);
        return {
            path: docPath,
            content: docContent,
            metadata,
        };
    }
    /**
     * Get all documents in a directory
     *
     * @param directory - The directory to search
     * @returns A list of documents with metadata
     */
    async getAllDocuments(directory = "") {
        const dirPath = this.getAbsolutePath(directory);
        const files = await this.getAllFiles(dirPath, directory);
        const documents = [];
        for (const file of files) {
            try {
                const doc = await this.readDocument(file);
                documents.push(doc);
            }
            catch (error) {
                console.error(`Error reading document ${file}:`, error);
            }
        }
        return documents;
    }
    /**
     * Handle the list_files tool
     *
     * @param args - The tool arguments
     * @returns A list of files
     */
    async handleListFiles(args) {
        const { directory } = args;
        const dirPath = this.getAbsolutePath(directory);
        const files = await this.getAllFiles(dirPath, directory);
        if (files.length === 0) {
            return "No documentation files found.";
        }
        return files.join("\n");
    }
    /**
     * Handle the list_directories tool
     *
     * @param args - The tool arguments
     * @returns A list of directories
     */
    async handleListDirectories(args) {
        const { directory } = args;
        const dirPath = this.getAbsolutePath(directory);
        const directories = await this.getAllDirectories(dirPath, directory);
        if (directories.length === 0) {
            return "No directories found.";
        }
        return directories.join("\n");
    }
    /**
     * Handle the get_document tool
     *
     * @param args - The tool arguments
     * @returns The document content and metadata
     */
    async handleGetDocument(args) {
        const { path: docPath } = args;
        const doc = await this.readDocument(docPath);
        return JSON.stringify({
            path: doc.path,
            content: doc.content,
            metadata: doc.metadata,
        }, null, 2);
    }
    /**
     * Handle the create_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    async handleCreateDocument(args) {
        const { path: docPath, content, metadata } = args;
        const fullPath = this.getAbsolutePath(docPath);
        // Create parent directories if they don't exist
        const parentDir = path.dirname(fullPath);
        await fs.mkdir(parentDir, { recursive: true });
        // Check if file already exists
        try {
            await fs.access(fullPath);
            throw new Error(`Document already exists: ${docPath}`);
        }
        catch (error) {
            // File doesn't exist, which is what we want for creation
        }
        // Serialize the document with metadata
        const docContent = this.serializeDocument(content, metadata);
        // Write the document
        await fs.writeFile(fullPath, docContent, "utf-8");
        return `Successfully created document: ${docPath}`;
    }
    /**
     * Handle the update_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    async handleUpdateDocument(args) {
        const { path: docPath, content, metadata } = args;
        const fullPath = this.getAbsolutePath(docPath);
        // Check if file exists
        try {
            await fs.access(fullPath);
        }
        catch (error) {
            throw new Error(`Document does not exist: ${docPath}`);
        }
        // Read existing document
        const existingContent = await fs.readFile(fullPath, "utf-8");
        const { content: existingDocContent, metadata: existingMetadata } = this.parseDocument(existingContent);
        // Update content and metadata
        const updatedContent = content !== undefined ? content : existingDocContent;
        const updatedMetadata = metadata !== undefined
            ? { ...existingMetadata, ...metadata }
            : existingMetadata;
        // Serialize the document with updated content and metadata
        const docContent = this.serializeDocument(updatedContent, updatedMetadata);
        // Write the document
        await fs.writeFile(fullPath, docContent, "utf-8");
        return `Successfully updated document: ${docPath}`;
    }
    /**
     * Handle the delete_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    async handleDeleteDocument(args) {
        const { path: docPath } = args;
        const fullPath = this.getAbsolutePath(docPath);
        // Check if file exists
        try {
            await fs.access(fullPath);
        }
        catch (error) {
            throw new Error(`Document does not exist: ${docPath}`);
        }
        // Delete the document
        await fs.unlink(fullPath);
        return `Successfully deleted document: ${docPath}`;
    }
    /**
     * Handle the search_documents tool
     *
     * @param args - The tool arguments
     * @returns Documents matching the search criteria
     */
    async handleSearchDocuments(args) {
        const { query, directory, tags, status } = args;
        const documents = await this.getAllDocuments(directory);
        // Filter documents by search criteria
        const matchingDocuments = documents.filter((doc) => {
            // Match by content
            const contentMatch = doc.content
                .toLowerCase()
                .includes(query.toLowerCase());
            // Match by metadata
            const metadataMatch = Object.entries(doc.metadata).some(([key, value]) => {
                if (typeof value === "string") {
                    return value.toLowerCase().includes(query.toLowerCase());
                }
                return false;
            });
            // Match by tags
            const tagsMatch = tags
                ? tags.every((tag) => Array.isArray(doc.metadata.tags) &&
                    doc.metadata.tags.includes(tag))
                : true;
            // Match by status
            const statusMatch = status ? doc.metadata.status === status : true;
            return (contentMatch || metadataMatch) && tagsMatch && statusMatch;
        });
        if (matchingDocuments.length === 0) {
            return "No documents match the search criteria.";
        }
        // Return paths of matching documents
        return matchingDocuments.map((doc) => doc.path).join("\n");
    }
    /**
     * Handle the analyze_docs tool
     *
     * @param args - The tool arguments
     * @returns Analysis of documentation health
     */
    async handleAnalyzeDocs(args) {
        const { directory } = args;
        const documents = await this.getAllDocuments(directory);
        // Calculate statistics
        const totalDocuments = documents.length;
        const documentsWithTags = documents.filter((doc) => Array.isArray(doc.metadata.tags) && doc.metadata.tags.length > 0).length;
        const documentsWithStatus = documents.filter((doc) => doc.metadata.status !== undefined).length;
        const averageLength = documents.reduce((sum, doc) => sum + doc.content.length, 0) /
            totalDocuments;
        // Check for empty or very short documents
        const shortDocuments = documents.filter((doc) => doc.content.trim().length < 100);
        // Check for missing titles
        const missingTitles = documents.filter((doc) => !doc.content.match(/^#\s.+/m) && !doc.metadata.title);
        return JSON.stringify({
            totalDocuments,
            statistics: {
                documentsWithTags,
                documentsWithStatus,
                averageLength: Math.round(averageLength),
                tagsPercentage: Math.round((documentsWithTags / totalDocuments) * 100),
                statusPercentage: Math.round((documentsWithStatus / totalDocuments) * 100),
            },
            issues: {
                shortDocuments: shortDocuments.map((doc) => doc.path),
                missingTitles: missingTitles.map((doc) => doc.path),
            },
        }, null, 2);
    }
    /**
     * Handle the get_health_score tool
     *
     * @param args - The tool arguments
     * @returns Documentation health score
     */
    async handleGetHealthScore(args) {
        const documents = await this.getAllDocuments();
        // Calculate score based on various factors
        const totalDocuments = documents.length;
        if (totalDocuments === 0) {
            return "No documents found. Health score: 0/100";
        }
        // Percentage of documents with tags
        const documentsWithTags = documents.filter((doc) => Array.isArray(doc.metadata.tags) && doc.metadata.tags.length > 0).length;
        const tagsScore = (documentsWithTags / totalDocuments) * 25;
        // Percentage of documents with status
        const documentsWithStatus = documents.filter((doc) => doc.metadata.status !== undefined).length;
        const statusScore = (documentsWithStatus / totalDocuments) * 15;
        // Percentage of documents with sufficient length
        const documentsWithGoodLength = documents.filter((doc) => doc.content.trim().length >= 100).length;
        const lengthScore = (documentsWithGoodLength / totalDocuments) * 30;
        // Percentage of documents with titles
        const documentsWithTitles = documents.filter((doc) => doc.content.match(/^#\s.+/m) || doc.metadata.title).length;
        const titleScore = (documentsWithTitles / totalDocuments) * 30;
        // Calculate total score
        const totalScore = Math.round(tagsScore + statusScore + lengthScore + titleScore);
        return `Documentation health score: ${totalScore}/100`;
    }
    /**
     * Handle the get_suggestions tool
     *
     * @param args - The tool arguments
     * @returns Suggestions for improving documentation
     */
    async handleGetSuggestions(args) {
        const documents = await this.getAllDocuments();
        const suggestions = [];
        // Check for missing documents
        if (documents.length === 0) {
            suggestions.push("- Create initial documentation files");
        }
        // Check for documents without tags
        const documentsWithoutTags = documents.filter((doc) => !Array.isArray(doc.metadata.tags) || doc.metadata.tags.length === 0);
        if (documentsWithoutTags.length > 0) {
            suggestions.push(`- Add tags to ${documentsWithoutTags.length} documents without tags`);
        }
        // Check for documents without status
        const documentsWithoutStatus = documents.filter((doc) => doc.metadata.status === undefined);
        if (documentsWithoutStatus.length > 0) {
            suggestions.push(`- Add status to ${documentsWithoutStatus.length} documents without status`);
        }
        // Check for short documents
        const shortDocuments = documents.filter((doc) => doc.content.trim().length < 100);
        if (shortDocuments.length > 0) {
            suggestions.push(`- Expand ${shortDocuments.length} short documents that have less than 100 characters`);
        }
        // Check for missing titles
        const missingTitles = documents.filter((doc) => !doc.content.match(/^#\s.+/m) && !doc.metadata.title);
        if (missingTitles.length > 0) {
            suggestions.push(`- Add titles to ${missingTitles.length} documents without titles`);
        }
        // General suggestions
        suggestions.push("- Consider organizing documentation in a logical directory structure", "- Add a README.md file to each directory to explain its contents", "- Use consistent formatting and style throughout documentation", "- Add links between related documents to improve navigation");
        return suggestions.join("\n");
    }
    /**
     * Connect the server to a transport
     *
     * @param transport - The transport to connect to
     */
    async connect(transport) {
        await this.server.connect(transport);
    }
}
//# sourceMappingURL=server.js.map