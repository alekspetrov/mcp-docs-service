import { z } from "zod";
export declare const ToolInputSchema: z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path?: string | undefined;
}, {
    path?: string | undefined;
}>;
export declare const ReadDocumentSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    path: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const ListDocumentsSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    basePath?: string | undefined;
}, {
    path?: string | undefined;
    basePath?: string | undefined;
}>;
export declare const GetStructureSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    basePath?: string | undefined;
}, {
    path?: string | undefined;
    basePath?: string | undefined;
}>;
export declare const GetNavigationSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    basePath?: string | undefined;
}, {
    path?: string | undefined;
    basePath?: string | undefined;
}>;
export declare const GetDocsKnowledgeBaseSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
    includeSummaries: z.ZodOptional<z.ZodBoolean>;
    maxSummaryLength: z.ZodOptional<z.ZodNumber>;
}>, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    basePath?: string | undefined;
    includeSummaries?: boolean | undefined;
    maxSummaryLength?: number | undefined;
}, {
    path?: string | undefined;
    basePath?: string | undefined;
    includeSummaries?: boolean | undefined;
    maxSummaryLength?: number | undefined;
}>;
export declare const WriteDocumentSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    path: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}>, "strip", z.ZodTypeAny, {
    content: string;
    path: string;
    metadata?: Record<string, any> | undefined;
}, {
    content: string;
    path: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const EditDocumentSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    path: z.ZodString;
    edits: z.ZodArray<z.ZodObject<{
        oldText: z.ZodString;
        newText: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        oldText: string;
        newText: string;
    }, {
        oldText: string;
        newText: string;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    path: string;
    edits: {
        oldText: string;
        newText: string;
    }[];
}, {
    path: string;
    edits: {
        oldText: string;
        newText: string;
    }[];
}>;
export declare const DeleteDocumentSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    path: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const SearchDocumentsSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    excludePatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    status?: string | undefined;
    path?: string | undefined;
    basePath?: string | undefined;
    query?: string | undefined;
    excludePatterns?: string[] | undefined;
}, {
    tags?: string[] | undefined;
    status?: string | undefined;
    path?: string | undefined;
    basePath?: string | undefined;
    query?: string | undefined;
    excludePatterns?: string[] | undefined;
}>;
export declare const CheckDocumentationHealthSchema: z.ZodObject<z.objectUtil.extendShape<{
    path: z.ZodOptional<z.ZodString>;
}, {
    basePath: z.ZodOptional<z.ZodString>;
    checkLinks: z.ZodOptional<z.ZodBoolean>;
    checkMetadata: z.ZodOptional<z.ZodBoolean>;
    checkOrphans: z.ZodOptional<z.ZodBoolean>;
    requiredMetadataFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}>, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    basePath?: string | undefined;
    checkLinks?: boolean | undefined;
    checkMetadata?: boolean | undefined;
    checkOrphans?: boolean | undefined;
    requiredMetadataFields?: string[] | undefined;
}, {
    path?: string | undefined;
    basePath?: string | undefined;
    checkLinks?: boolean | undefined;
    checkMetadata?: boolean | undefined;
    checkOrphans?: boolean | undefined;
    requiredMetadataFields?: string[] | undefined;
}>;
