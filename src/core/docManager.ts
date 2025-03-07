/**
 * Document Manager for handling file operations
 */

import {
  DocContent,
  DocCreateParams,
  DocMetadata,
  DocSummary,
  DocUpdateParams,
  SearchOptions,
} from "../types/index.ts";
import {
  parseMarkdownWithFrontMatter,
  combineMetadataAndContent,
} from "./docProcessor.ts";

export class DocManager {
  private baseDir: string;

  constructor(baseDir: string = "./docs") {
    this.baseDir = baseDir;
  }

  /**
   * List all markdown files in a directory recursively
   */
  async listMarkdownFiles(dir: string = ""): Promise<string[]> {
    const fullDir = `${this.baseDir}/${dir}`.replace(/\/\//g, "/");
    const files: string[] = [];

    try {
      for await (const entry of Deno.readDir(fullDir)) {
        const entryPath = `${dir}/${entry.name}`.replace(/^\//, "");

        if (entry.isDirectory) {
          const subDirFiles = await this.listMarkdownFiles(entryPath);
          files.push(...subDirFiles);
        } else if (entry.isFile && entry.name.endsWith(".md")) {
          files.push(entryPath);
        }
      }
    } catch (error) {
      console.error(`Error listing files in ${fullDir}:`, error);
    }

    return files;
  }

  /**
   * Get document content and metadata
   */
  async getDocument(path: string): Promise<DocContent | null> {
    try {
      const fullPath = `${this.baseDir}/${path}`.replace(/\/\//g, "/");
      const content = await Deno.readTextFile(fullPath);
      return parseMarkdownWithFrontMatter(path, content);
    } catch (error) {
      console.error(`Error reading document ${path}:`, error);
      return null;
    }
  }

  /**
   * List directories in the docs folder
   */
  async listDirectories(dir: string = ""): Promise<string[]> {
    const fullDir = `${this.baseDir}/${dir}`.replace(/\/\//g, "/");
    const directories: string[] = [];

    try {
      for await (const entry of Deno.readDir(fullDir)) {
        if (entry.isDirectory) {
          const dirPath = `${dir}/${entry.name}`.replace(/^\//, "");
          directories.push(dirPath);
        }
      }
    } catch (error) {
      console.error(`Error listing directories in ${fullDir}:`, error);
    }

    return directories;
  }

  /**
   * Create a new document
   */
  async createDocument(params: DocCreateParams): Promise<boolean> {
    try {
      // Ensure the path is valid
      if (!params.path.endsWith(".md")) {
        params.path = `${params.path}.md`;
      }

      // Build the full file content with front matter
      const fileContent = combineMetadataAndContent(
        params.metadata,
        params.content
      );

      // Ensure directory exists
      const fullPath = `${this.baseDir}/${params.path}`.replace(/\/\//g, "/");
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"));

      await Deno.mkdir(dirPath, { recursive: true });

      // Write the file
      await Deno.writeTextFile(fullPath, fileContent);
      return true;
    } catch (error) {
      console.error(`Error creating document ${params.path}:`, error);
      return false;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(params: DocUpdateParams): Promise<boolean> {
    try {
      // Get the existing document
      const doc = await this.getDocument(params.path);
      if (!doc) {
        return false;
      }

      // Update metadata and content as needed
      const updatedMetadata = { ...doc.metadata, ...(params.metadata || {}) };
      const updatedContent =
        params.content !== undefined ? params.content : doc.content;

      // Build the full file content with front matter
      const fileContent = combineMetadataAndContent(
        updatedMetadata,
        updatedContent
      );

      // Write the file
      const fullPath = `${this.baseDir}/${params.path}`.replace(/\/\//g, "/");
      await Deno.writeTextFile(fullPath, fileContent);
      return true;
    } catch (error) {
      console.error(`Error updating document ${params.path}:`, error);
      return false;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(path: string): Promise<boolean> {
    try {
      const fullPath = `${this.baseDir}/${path}`.replace(/\/\//g, "/");
      await Deno.remove(fullPath);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${path}:`, error);
      return false;
    }
  }

  /**
   * Basic search for documents matching query
   */
  async searchDocuments(options: SearchOptions): Promise<DocSummary[]> {
    const { query, tags, status, directory } = options;
    const results: DocSummary[] = [];

    // Get all markdown files in the specified directory or all if not specified
    const files = await this.listMarkdownFiles(directory || "");

    // Filter and search through files
    for (const filePath of files) {
      const doc = await this.getDocument(filePath);
      if (!doc) continue;

      // Check if document matches search criteria
      const searchableText = `${doc.metadata.title} ${
        doc.metadata.description || ""
      } ${doc.content}`.toLowerCase();
      const matchesQuery =
        !query || searchableText.includes(query.toLowerCase());

      const matchesTags =
        !tags ||
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
  async getAllDocumentSummaries(directory?: string): Promise<DocSummary[]> {
    const files = await this.listMarkdownFiles(directory || "");
    const summaries: DocSummary[] = [];

    for (const filePath of files) {
      const doc = await this.getDocument(filePath);
      if (!doc) continue;

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
