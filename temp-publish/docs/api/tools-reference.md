---
title: MCP Tools Reference
description: Complete reference of all tools available in the MCP Docs Manager
author: Claude
date: 2023-03-12
tags:
  - api
  - reference
  - tools
status: published
order: 2
---

# MCP Tools Reference

This document provides a complete reference of all tools available in the MCP Docs Manager service.

## Documentation Tools

These tools are specifically designed for working with documentation files (markdown with frontmatter).

### read_document

Reads a markdown document and extracts its content and metadata.

**Parameters:**

- `path` (required): Path to the document to read

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "read_document", {
  path: "docs/guides/getting-started.md",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Document read successfully" }
  ],
  metadata: {
    path: string,
    content: string, // Document content without frontmatter
    metadata: {
      title?: string,
      description?: string,
      author?: string,
      date?: Date,
      tags?: string[],
      status?: string,
      // Other metadata fields
    }
  }
}
```

### list_documents

Lists all markdown documents in a directory.

**Parameters:**

- `basePath` (optional): Base path to search from

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "list_documents", {
  basePath: "docs",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Found X documents" }
  ],
  metadata: {
    documents: Array<{
      path: string,
      name: string,
      metadata: {
        // Document metadata
      }
    }>
  }
}
```

### get_structure

Gets the structure of the documentation directory.

**Parameters:**

- `basePath` (optional): Base path to get structure from

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "get_structure", {
  basePath: "docs",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Documentation structure retrieved successfully" }
  ],
  metadata: {
    structure: {
      name: string,
      path: string,
      type: "directory" | "file",
      metadata?: object,
      children: Array<TreeEntry>,
      error?: string
    }
  }
}
```

### get_navigation

Gets the navigation structure for the documentation.

**Parameters:**

- `basePath` (optional): Base path to generate navigation from

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "get_navigation", {
  basePath: "docs",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Navigation structure retrieved successfully" }
  ],
  metadata: {
    navigation: Array<{
      title: string,
      path: string | null,
      items: Array<{
        title: string,
        path: string,
        order: number
      }>,
      order: number
    }>
  }
}
```

### get_docs_knowledge_base

Creates a comprehensive knowledge base of documentation for LLM context. This tool is particularly useful for providing the LLM with a complete overview of your documentation without requiring multiple file searches.

**Parameters:**

- `basePath` (optional): Base path to generate knowledge base from
- `includeSummaries` (optional): Whether to include content summaries (default: true)
- `maxSummaryLength` (optional): Maximum length of summaries (default: 500)

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "get_docs_knowledge_base", {
  basePath: "docs",
  includeSummaries: true,
  maxSummaryLength: 300,
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Generated knowledge base with X documents" }
  ],
  metadata: {
    knowledgeBase: {
      navigation: Array<NavigationSection>,
      documents: Array<{
        path: string,
        name: string,
        metadata: DocumentMetadata,
        summary?: string
      }>,
      categories: {
        [directoryPath: string]: Array<DocumentEntry>
      },
      tags: {
        [tag: string]: Array<DocumentEntry>
      }
    }
  }
}
```

The knowledge base includes:

- **navigation**: The navigation structure of the documentation
- **documents**: All documents with their metadata and optional summaries
- **categories**: Documents organized by directory
- **tags**: Documents organized by tags

### write_document

Writes content to a markdown document with frontmatter metadata.

**Parameters:**

- `path` (required): Path to the document to write
- `content` (required): Document content (without frontmatter)
- `metadata` (optional): Document metadata as an object

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "write_document", {
  path: "docs/examples/example.md",
  content: "# Example Document\n\nThis is an example document.",
  metadata: {
    title: "Example Document",
    description: "An example document",
    author: "MCP Docs Manager",
    date: new Date().toISOString(),
    tags: ["example", "documentation"],
    status: "draft",
  },
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Document written successfully" }
  ],
  metadata: {
    path: string
  }
}
```

### edit_document

Applies edits to a markdown document while preserving frontmatter.

**Parameters:**

- `path` (required): Path to the document to edit
- `edits` (required): Array of edits to apply
  - `oldText` (required): Text to replace
  - `newText` (required): Text to replace with

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "edit_document", {
  path: "docs/examples/example.md",
  edits: [
    {
      oldText: "This is an example document.",
      newText: "This is an updated example document.",
    },
  ],
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Document edited successfully" }
  ],
  metadata: {
    path: string,
    appliedEdits: number
  }
}
```

### delete_document

Deletes a markdown document.

**Parameters:**

- `path` (required): Path to the document to delete

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "delete_document", {
  path: "docs/examples/example.md",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Document deleted successfully" }
  ],
  metadata: {
    path: string
  }
}
```

### search_documents

Searches for markdown documents matching criteria.

**Parameters:**

- `basePath` (optional): Base path to search from
- `query` (optional): Search query to match against document content and metadata
- `excludePatterns` (optional): Array of glob patterns to exclude
- `tags` (optional): Array of tags to filter by
- `status` (optional): Status to filter by

**Example:**

```typescript
const result = await mcp.callTool("docs-manager", "search_documents", {
  basePath: "docs",
  query: "getting started",
  tags: ["guide"],
  status: "published",
});
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Found X matching documents" }
  ],
  metadata: {
    documents: Array<{
      path: string,
      name: string,
      metadata: {
        // Document metadata
      }
    }>
  }
}
```

### check_documentation_health

Checks the health of documentation and identifies issues.

**Parameters:**

- `basePath` (optional): Base path to check documentation in
- `checkLinks` (optional): Whether to check for broken internal links (default: true)
- `checkMetadata` (optional): Whether to check for missing metadata fields (default: true)
- `checkOrphans` (optional): Whether to check for orphaned documents (default: true)
- `requiredMetadataFields` (optional): List of metadata fields that should be present (default: ["title", "description", "status"])

**Example:**

```typescript
const result = await mcp.callTool(
  "docs-manager",
  "check_documentation_health",
  {
    basePath: "docs",
    checkLinks: true,
    checkMetadata: true,
    checkOrphans: true,
    requiredMetadataFields: ["title", "description", "status"],
  }
);
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Documentation health check completed. Overall health score: X%" }
  ],
  metadata: {
    score: number,              // Overall health score (0-100)
    totalDocuments: number,     // Total number of documents checked
    issues: Array<{
      path: string,
      type: 'missing_metadata' | 'broken_link' | 'orphaned' | 'missing_reference',
      severity: 'error' | 'warning' | 'info',
      message: string,
      details?: any
    }>,
    metadataCompleteness: number, // Percentage of required metadata fields present
    brokenLinks: number,        // Number of broken internal links
    orphanedDocuments: number,  // Number of documents not in navigation
    missingReferences: number,  // Number of missing references
    documentsByStatus: Record<string, number>, // Count of documents by status
    documentsByTag: Record<string, number>     // Count of documents by tag
  }
}
```

For more details, see the [Check Documentation Health](tools/check-documentation-health.md) reference.

## When to Use Each Tool

### Documentation Tools

- **read_document**: Use when you need to read a specific markdown document and access both its content and metadata (frontmatter).
- **list_documents**: Use when you need to get a list of all markdown documents in a directory, including their metadata.
- **get_structure**: Use when you need to understand the hierarchical structure of your documentation, including directories and files.
- **get_navigation**: Use when you need to generate a navigation structure for your documentation based on the file structure and metadata.
- **get_docs_knowledge_base**: Use when you need to provide an LLM with comprehensive context about your documentation. This tool is ideal for creating a knowledge base that can be used to answer questions without requiring multiple file searches.
- **write_document**: Use when you need to create or update a markdown document with frontmatter metadata.
- **edit_document**: Use when you need to make specific edits to a markdown document while preserving its frontmatter.
- **delete_document**: Use when you need to delete a markdown document.
- **search_documents**: Use when you need to search for markdown documents based on content or metadata.

## Best Practices

1. **Error Handling**: Always check for the `isError` flag in the response to handle errors appropriately.

2. **Path Handling**: Paths can be relative to the allowed directories or absolute. If using absolute paths, ensure they are within the allowed directories.

3. **Performance Considerations**: For large documentation repositories, consider using more specific tools (like `read_document` for a specific file) rather than broader tools (like `get_structure` for the entire repository).

4. **Metadata Usage**: Take advantage of the metadata extracted from markdown frontmatter to organize and structure your documentation.
