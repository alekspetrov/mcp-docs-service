"use strict";
/**
 * Document Manager for handling file operations
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
exports.DocManager = void 0;
const fs = __importStar(require("fs"));
const fsPromises = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const docProcessor_js_1 = require("./docProcessor.js");
class DocManager {
    constructor(baseDir = "./docs", options = {}) {
        this.baseDir = baseDir;
        this.options = {
            createIfNotExists: options.createIfNotExists ?? false,
            fileExtensions: options.fileExtensions ?? [".md", ".mdx"],
        };
        // Initialize directory if needed
        this.initializeDirectory();
    }
    /**
     * Initialize the docs directory
     */
    initializeDirectory() {
        try {
            // Check if directory exists
            fs.accessSync(this.baseDir);
            console.error(`Using existing docs directory: ${this.baseDir}`);
        }
        catch (error) {
            // Directory doesn't exist
            if (this.options.createIfNotExists) {
                try {
                    fs.mkdirSync(this.baseDir, { recursive: true });
                    console.error(`Created docs directory: ${this.baseDir}`);
                    // Create a sample README.md file in the new directory
                    const readmePath = path.join(this.baseDir, "README.md");
                    const readmeContent = `# Documentation\n\nThis directory was created by the MCP Documentation Service.\n`;
                    fs.writeFileSync(readmePath, readmeContent, "utf-8");
                    console.error(`Created sample README.md in ${this.baseDir}`);
                }
                catch (createError) {
                    console.error(`Failed to create docs directory: ${createError}`);
                }
            }
            else {
                console.error(`Docs directory doesn't exist: ${this.baseDir}`);
                console.error("Use --create-dir option to create it automatically");
            }
        }
    }
    /**
     * List all markdown files in a directory recursively
     */
    async listMarkdownFiles(dir = "") {
        const fullDir = path.join(this.baseDir, dir);
        const files = [];
        try {
            const entries = await fsPromises.readdir(fullDir, {
                withFileTypes: true,
            });
            for (const entry of entries) {
                const entryPath = path.join(dir, entry.name).replace(/^\//, "");
                if (entry.isDirectory()) {
                    const subDirFiles = await this.listMarkdownFiles(entryPath);
                    files.push(...subDirFiles);
                }
                else if (entry.isFile() && entry.name.endsWith(".md")) {
                    files.push(entryPath);
                }
            }
        }
        catch (error) {
            console.error(`Error listing files in ${fullDir}:`, error);
        }
        return files;
    }
    /**
     * Get document content and metadata
     */
    async getDocument(filePath) {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            const content = await fsPromises.readFile(fullPath, "utf-8");
            return (0, docProcessor_js_1.parseMarkdownWithFrontMatter)(filePath, content);
        }
        catch (error) {
            console.error(`Error reading document ${filePath}:`, error);
            return null;
        }
    }
    /**
     * List directories in the docs folder
     */
    async listDirectories(dir = "") {
        const fullDir = path.join(this.baseDir, dir);
        const directories = [];
        try {
            const entries = await fsPromises.readdir(fullDir, {
                withFileTypes: true,
            });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const dirPath = path.join(dir, entry.name).replace(/^\//, "");
                    directories.push(dirPath);
                }
            }
        }
        catch (error) {
            console.error(`Error listing directories in ${fullDir}:`, error);
        }
        return directories;
    }
    /**
     * Create a new document
     */
    async createDocument(params) {
        try {
            // Ensure the path is valid
            if (!params.path.endsWith(".md")) {
                params.path = `${params.path}.md`;
            }
            // Build the full file content with front matter
            const fileContent = (0, docProcessor_js_1.combineMetadataAndContent)(params.metadata, params.content);
            // Ensure directory exists
            const fullPath = path.join(this.baseDir, params.path);
            const dirPath = path.dirname(fullPath);
            await fsPromises.mkdir(dirPath, { recursive: true });
            // Write the file
            await fsPromises.writeFile(fullPath, fileContent, "utf-8");
            return true;
        }
        catch (error) {
            console.error(`Error creating document ${params.path}:`, error);
            return false;
        }
    }
    /**
     * Update an existing document
     */
    async updateDocument(params) {
        try {
            // Get the existing document
            const doc = await this.getDocument(params.path);
            if (!doc) {
                return false;
            }
            // Update metadata and content as needed
            const updatedMetadata = { ...doc.metadata, ...(params.metadata || {}) };
            const updatedContent = params.content !== undefined ? params.content : doc.content;
            // Build the full file content with front matter
            const fileContent = (0, docProcessor_js_1.combineMetadataAndContent)(updatedMetadata, updatedContent);
            // Write the file
            const fullPath = path.join(this.baseDir, params.path);
            await fsPromises.writeFile(fullPath, fileContent, "utf-8");
            return true;
        }
        catch (error) {
            console.error(`Error updating document ${params.path}:`, error);
            return false;
        }
    }
    /**
     * Delete a document
     */
    async deleteDocument(filePath) {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            await fsPromises.unlink(fullPath);
            return true;
        }
        catch (error) {
            console.error(`Error deleting document ${filePath}:`, error);
            return false;
        }
    }
    /**
     * Basic search for documents matching query
     */
    async searchDocuments(options) {
        const { query, tags, status, directory } = options;
        const results = [];
        // Get all markdown files in the specified directory or all if not specified
        const files = await this.listMarkdownFiles(directory || "");
        // Filter and search through files
        for (const filePath of files) {
            const doc = await this.getDocument(filePath);
            if (!doc)
                continue;
            // Check if document matches search criteria
            const searchableText = `${doc.metadata.title} ${doc.metadata.description || ""} ${doc.content}`.toLowerCase();
            const matchesQuery = !query || searchableText.includes(query.toLowerCase());
            const matchesTags = !tags ||
                !tags.length ||
                (doc.metadata.tags &&
                    tags.some((tag) => doc.metadata.tags?.includes(tag)));
            const matchesStatus = !status || doc.metadata.status === status;
            if (matchesQuery && matchesTags && matchesStatus) {
                results.push({
                    title: doc.metadata.title,
                    description: doc.metadata.description,
                    path: doc.path,
                    lastUpdated: doc.metadata.lastUpdated,
                    tags: doc.metadata.tags,
                    status: doc.metadata.status,
                });
            }
        }
        return results;
    }
    /**
     * Get all documents as summaries
     */
    async getAllDocumentSummaries(directory) {
        const files = await this.listMarkdownFiles(directory || "");
        const summaries = [];
        for (const filePath of files) {
            const doc = await this.getDocument(filePath);
            if (!doc)
                continue;
            summaries.push({
                title: doc.metadata.title,
                description: doc.metadata.description,
                path: doc.path,
                lastUpdated: doc.metadata.lastUpdated,
                tags: doc.metadata.tags,
                status: doc.metadata.status,
            });
        }
        return summaries;
    }
}
exports.DocManager = DocManager;
//# sourceMappingURL=docManager.js.map