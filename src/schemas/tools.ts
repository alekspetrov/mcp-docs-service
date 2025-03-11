import { z } from "zod";

// Base schema for tool inputs
export const ToolInputSchema = z.object({
  path: z.string().optional(),
});

// File operation schemas
export const ReadFileSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const WriteFileSchema = ToolInputSchema.extend({
  path: z.string(),
  content: z.string(),
});

export const ListFilesSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const GetFileInfoSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const SearchFilesSchema = ToolInputSchema.extend({
  rootPath: z.string(),
  pattern: z.string(),
  excludePatterns: z.array(z.string()).optional(),
});

export const EditFileSchema = ToolInputSchema.extend({
  path: z.string(),
  edits: z.array(
    z.object({
      oldText: z.string(),
      newText: z.string(),
    })
  ),
});

export const GetDirectoryTreeSchema = ToolInputSchema.extend({
  path: z.string(),
});

// Documentation schemas
export const ReadDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const ListDocumentsSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
});

export const GetStructureSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
});

export const GetNavigationSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
});
