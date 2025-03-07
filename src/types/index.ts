/**
 * Type definitions for the MCP Documentation Service
 */

// Common types
export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface ParsedDocument {
  content: string;
  metadata: Record<string, any>;
  rawContent: string;
}

export interface MCPQueryResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SearchOptions {
  query: string;
  directory?: string;
  tags?: string[];
  status?: string;
  limit?: number;
}

export interface SearchResult {
  path: string;
  title: string;
  description?: string;
  tags?: string[];
  status?: string;
  relevance: number;
  excerpt: string;
}

export interface AnalysisResult {
  totalDocuments: number;
  documentsWithDescription: number;
  documentsWithTags: number;
  documentsWithStatus: number;
  healthScore: number;
  suggestions: Suggestion[];
  directoryStats: Record<string, DirectoryStats>;
}

export interface DirectoryStats {
  documentCount: number;
  averageWordCount: number;
  hasReadme: boolean;
}

export interface Suggestion {
  type: SuggestionType;
  path?: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export enum SuggestionType {
  MissingDescription = "missing_description",
  MissingTags = "missing_tags",
  MissingStatus = "missing_status",
  EmptyDirectory = "empty_directory",
  MissingReadme = "missing_readme",
  LowWordCount = "low_word_count",
}

export interface DocCreateParams {
  path: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface DocUpdateParams {
  path: string;
  content?: string;
  metadata?: Record<string, any>;
}

// Configuration options
export interface MCPDocsServerOptions {
  fileExtensions?: string[];
  createIfNotExists?: boolean;
  debug?: boolean;
}
