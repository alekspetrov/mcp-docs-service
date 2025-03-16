import { z } from "zod";

// Base schema for tool inputs
export const ToolInputSchema = z.object({
  path: z.string().optional(),
});

// Documentation schemas
export const ReadDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const ListDocumentsSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
  recursive: z.boolean().default(false),
});

export const GetStructureSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
});

export const GetNavigationSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
});

export const GetDocsKnowledgeBaseSchema = ToolInputSchema.extend({
  basePath: z.string().optional(),
  includeSummaries: z.boolean().optional(),
  maxSummaryLength: z.number().optional(),
});

export const WriteDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
  content: z.string(),
  createDirectories: z.boolean().default(true),
});

export const EditDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
  edits: z.array(
    z.object({
      oldText: z.string(),
      newText: z.string(),
    })
  ),
  dryRun: z.boolean().default(false),
});

export const DeleteDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
});

export const SearchDocumentsSchema = ToolInputSchema.extend({
  query: z.string(),
  basePath: z.string().optional().default(""),
});

export const CheckDocumentationHealthSchema = ToolInputSchema.extend({
  basePath: z.string().optional().default(""),
});

// New schemas for Phase 2 features
export const CreateFolderSchema = ToolInputSchema.extend({
  path: z.string(),
  createReadme: z.boolean().default(true),
});

export const MoveDocumentSchema = ToolInputSchema.extend({
  sourcePath: z.string(),
  destinationPath: z.string(),
  updateReferences: z.boolean().default(true),
});

export const RenameDocumentSchema = ToolInputSchema.extend({
  path: z.string(),
  newName: z.string(),
  updateReferences: z.boolean().default(true),
});

export const UpdateNavigationOrderSchema = ToolInputSchema.extend({
  path: z.string(),
  order: z.number(),
});

export const CreateSectionSchema = ToolInputSchema.extend({
  title: z.string(),
  path: z.string(),
  order: z.number().optional(),
});

// New schemas for Phase 3 features
export const ValidateLinksSchema = ToolInputSchema.extend({
  basePath: z.string().optional().default(""),
  recursive: z.boolean().default(true),
});

export const ValidateMetadataSchema = ToolInputSchema.extend({
  basePath: z.string().optional().default(""),
  requiredFields: z.array(z.string()).optional(),
});
