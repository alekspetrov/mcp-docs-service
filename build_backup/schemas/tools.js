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
    metadata: z.record(z.any()).optional(),
});
export const EditDocumentSchema = ToolInputSchema.extend({
    path: z.string(),
    edits: z.array(z.object({
        oldText: z.string(),
        newText: z.string(),
    })),
});
export const DeleteDocumentSchema = ToolInputSchema.extend({
    path: z.string(),
});
export const SearchDocumentsSchema = ToolInputSchema.extend({
    basePath: z.string().optional(),
    query: z.string().optional(),
    excludePatterns: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().optional(),
});
export const CheckDocumentationHealthSchema = ToolInputSchema.extend({
    basePath: z.string().optional(),
    checkLinks: z.boolean().optional(),
    checkMetadata: z.boolean().optional(),
    checkOrphans: z.boolean().optional(),
    requiredMetadataFields: z.array(z.string()).optional(),
});
