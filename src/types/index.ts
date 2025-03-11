import { z } from "zod";

// File and directory related types
export interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

// Documentation related types
export interface DocumentMetadata {
  title?: string;
  order?: number;
  description?: string;
  author?: string;
  date?: Date;
  tags?: string[];
  status?: string;
  [key: string]: any;
}

export interface DocumentEntry {
  path: string;
  name: string;
  metadata: DocumentMetadata;
}

export interface TreeEntry {
  name: string;
  path: string;
  type: string;
  metadata?: DocumentMetadata;
  children: TreeEntry[];
  error?: string;
}

export interface NavigationItem {
  title: string;
  path: string | null;
  order: number;
}

export interface NavigationSection {
  title: string;
  path: string | null;
  items: NavigationItem[];
  order: number;
}

// Tool response types
export type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  metadata?: Record<string, any>;
  isError?: boolean;
};

// Re-export all types from specialized modules
export * from "./file.js";
export * from "./docs.js";
export * from "./tools.js";
