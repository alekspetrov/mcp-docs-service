/**
 * MCP Documentation Management Server
 * This server implements the Model Context Protocol for managing documentation
 */

import { DocManager } from "./docManager.ts";
import { DocAnalyzer } from "./docAnalyzer.ts";
import {
  DocCreateParams,
  DocUpdateParams,
  MCPQueryResult,
  SearchOptions,
} from "../types/index.ts";

export class MCPDocsServer {
  private docManager: DocManager;
  private docAnalyzer: DocAnalyzer;

  constructor(docsDir: string = "./docs") {
    this.docManager = new DocManager(docsDir);
    this.docAnalyzer = new DocAnalyzer(this.docManager);
  }

  /**
   * Execute a query using the MCP protocol
   */
  async executeQuery(sql: string): Promise<MCPQueryResult> {
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
    } catch (error) {
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
  private parseQuery(query: string): {
    command: string;
    params: Record<string, any>;
  } {
    // Default to empty parameters
    const params: Record<string, any> = {};

    // Handle simple command syntax
    if (query.indexOf("(") === -1) {
      return { command: query.trim(), params };
    }

    // Extract command name
    const commandMatch = query.match(/^\s*(\w+)\s*\(/);
    if (!commandMatch) {
      throw new Error("Invalid query format");
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
      } catch (e) {
        throw new Error(`Invalid JSON parameters: ${e.message}`);
      }
    }

    // Handle key=value parameters
    const paramPairs = paramsStr.split(",");
    for (const pair of paramPairs) {
      const [key, ...valueParts] = pair.split("=");
      const value = valueParts.join("=").trim();

      if (key && value) {
        // Handle quoted strings
        if (
          (value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))
        ) {
          params[key.trim()] = value.slice(1, -1);
        }
        // Handle numbers
        else if (!isNaN(Number(value))) {
          params[key.trim()] = Number(value);
        }
        // Handle booleans
        else if (value === "true" || value === "false") {
          params[key.trim()] = value === "true";
        }
        // Everything else as string
        else {
          params[key.trim()] = value;
        }
      }
    }

    return { command, params };
  }

  /**
   * List all markdown files
   */
  private async listFiles(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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
  private async listDirectories(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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
  private async getDocument(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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
  private async searchDocuments(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
    const options: SearchOptions = {
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
  private async createDocument(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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

    const createParams: DocCreateParams = {
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
  private async updateDocument(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
    if (!params.path) {
      return {
        success: false,
        error: "Document path is required",
      };
    }

    const updateParams: DocUpdateParams = {
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
  private async deleteDocument(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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
  private async analyzeDocumentation(
    params: Record<string, any>
  ): Promise<MCPQueryResult> {
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
  private async getHealthScore(): Promise<MCPQueryResult> {
    const score = await this.docAnalyzer.calculateHealthScore();

    return {
      success: true,
      data: { score },
    };
  }

  /**
   * Get suggestions for improving documentation
   */
  private async getSuggestions(): Promise<MCPQueryResult> {
    const suggestions = await this.docAnalyzer.generateSuggestions();

    return {
      success: true,
      data: { suggestions },
    };
  }
}
