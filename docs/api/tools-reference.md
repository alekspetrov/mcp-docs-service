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

## Basic Document Operations

### read_document

Reads a markdown document and extracts its content and metadata.

**Parameters:**

- `path` (required): Path to the document to read

**Example:**

```typescript
// Using the MCP protocol directly
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "read_document",
    arguments: {
      path: "docs/guides/getting-started.md",
    },
  },
};
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
- `recursive` (optional): Whether to search recursively (default: false)

**Example:**

```typescript
// Using the MCP protocol directly
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "list_documents",
    arguments: {
      basePath: "docs",
      recursive: true,
    },
  },
};
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

### write_document

Writes content to a markdown document with frontmatter metadata.

**Parameters:**

- `path` (required): Path to the document to write
- `content` (required): Document content (without frontmatter)
- `createDirectories` (optional): Whether to create parent directories if they don't exist (default: true)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "write_document",
    arguments: {
      path: "docs/examples/example.md",
      content: "# Example Document\n\nThis is an example document.",
      createDirectories: true,
    },
  },
};
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
- `dryRun` (optional): Whether to perform a dry run without making changes (default: false)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "edit_document",
    arguments: {
      path: "docs/examples/example.md",
      edits: [
        {
          oldText: "This is an example document.",
          newText: "This is an updated example document.",
        },
      ],
      dryRun: false,
    },
  },
};
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

### search_documents

Searches for markdown documents matching criteria.

**Parameters:**

- `query` (required): Search query to match against document content and metadata
- `basePath` (optional): Base path to search from (default: "")

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "search_documents",
    arguments: {
      query: "getting started",
      basePath: "docs",
    },
  },
};
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

## Navigation and Structure

### generate_documentation_navigation

Generates a navigation structure from the markdown documents in the docs directory.

**Parameters:**

- `basePath` (optional): Base path to generate navigation from

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "generate_documentation_navigation",
    arguments: {
      basePath: "docs",
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Navigation structure generated successfully" }
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

### check_documentation_health

Checks the health of documentation and identifies issues.

**Parameters:**

- `basePath` (optional): Base path to check documentation in (default: "")

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "check_documentation_health",
    arguments: {
      basePath: "docs",
    },
  },
};
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

## Enhanced Structure Management

### create_documentation_folder

Creates a new folder in the docs directory.

**Parameters:**

- `path` (required): Path to the folder to create
- `createReadme` (optional): Whether to create a README.md file in the folder (default: true)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "create_documentation_folder",
    arguments: {
      path: "docs/new-section",
      createReadme: true,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Successfully created folder: docs/new-section" }
  ],
  metadata: {
    path: string,
    readme: string | null
  }
}
```

### move_document

Moves a document from one location to another.

**Parameters:**

- `sourcePath` (required): Path to the document to move
- `destinationPath` (required): Path to move the document to
- `updateReferences` (optional): Whether to update references to the document in other files (default: true)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "move_document",
    arguments: {
      sourcePath: "docs/old-location/document.md",
      destinationPath: "docs/new-location/document.md",
      updateReferences: true,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Successfully moved document from docs/old-location/document.md to docs/new-location/document.md" }
  ],
  metadata: {
    sourcePath: string,
    destinationPath: string,
    referencesUpdated: number
  }
}
```

### rename_document

Renames a document while preserving its location and content.

**Parameters:**

- `path` (required): Path to the document to rename
- `newName` (required): New name for the document (without extension)
- `updateReferences` (optional): Whether to update references to the document in other files (default: true)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "rename_document",
    arguments: {
      path: "docs/section/old-name.md",
      newName: "new-name",
      updateReferences: true,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Successfully renamed document from old-name.md to new-name.md" }
  ],
  metadata: {
    originalPath: string,
    newPath: string,
    referencesUpdated: number
  }
}
```

### update_documentation_navigation_order

Updates the navigation order of a document by modifying its frontmatter.

**Parameters:**

- `path` (required): Path to the document to update
- `order` (required): New order value for the document

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "update_documentation_navigation_order",
    arguments: {
      path: "docs/section/document.md",
      order: 3,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Successfully updated navigation order for docs/section/document.md to 3" }
  ],
  metadata: {
    path: string,
    order: number
  }
}
```

### create_documentation_section

Creates a new navigation section with an index.md file.

**Parameters:**

- `title` (required): Title for the section
- `path` (required): Path to create the section at
- `order` (optional): Order value for the section

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "create_documentation_section",
    arguments: {
      title: "New Section",
      path: "docs/new-section",
      order: 5,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Successfully created section: New Section at docs/new-section" }
  ],
  metadata: {
    title: string,
    path: string,
    indexPath: string,
    order?: number
  }
}
```

## Documentation Validation

### validate_documentation_links

Checks for broken internal links in documentation files.

**Parameters:**

- `basePath` (optional): Base path to check links in (default: "")
- `recursive` (optional): Whether to check links recursively (default: true)

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "validate_documentation_links",
    arguments: {
      basePath: "docs",
      recursive: true,
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Found X broken links in Y files" }
  ],
  metadata: {
    brokenLinks: Array<{
      file: string,
      link: string,
      lineNumber: number
    }>,
    filesChecked: number,
    basePath: string
  }
}
```

### validate_documentation_metadata

Ensures all documents have required metadata fields.

**Parameters:**

- `basePath` (optional): Base path to check metadata in (default: "")
- `requiredFields` (optional): Array of required metadata fields (default: ["title", "description", "status"])

**Example:**

```typescript
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "validate_documentation_metadata",
    arguments: {
      basePath: "docs",
      requiredFields: ["title", "description", "status", "date"],
    },
  },
};
```

**Response:**

```typescript
{
  content: [
    { type: "text", text: "Found X files with missing metadata. Completeness: Y%" }
  ],
  metadata: {
    missingMetadata: Array<{
      file: string,
      missingFields: string[]
    }>,
    filesChecked: number,
    requiredFields: string[],
    completenessPercentage: number,
    basePath: string
  }
}
```

## When to Use Each Tool

### Basic Document Operations

- **read_document**: Use when you need to read a specific markdown document and access both its content and metadata (frontmatter).
- **list_documents**: Use when you need to get a list of all markdown documents in a directory, including their metadata.
- **write_document**: Use when you need to create or update a markdown document with frontmatter metadata.
- **edit_document**: Use when you need to make specific edits to a markdown document while preserving its frontmatter.
- **search_documents**: Use when you need to search for markdown documents based on content or metadata.

### Navigation and Structure

- **generate_documentation_navigation**: Use when you need to generate a navigation structure for your documentation based on the file structure and metadata.
- **check_documentation_health**: Use when you need to check the health of your documentation, including missing metadata, broken links, and orphaned documents.

### Enhanced Structure Management

- **create_documentation_folder**: Use when you need to create a new folder for documentation with an optional README.md file.
- **move_document**: Use when you need to move a document from one location to another while updating references.
- **rename_document**: Use when you need to rename a document while preserving its location and updating references.
- **update_documentation_navigation_order**: Use when you need to change the order of a document in navigation.
- **create_documentation_section**: Use when you need to create a new navigation section with an index.md file.

### Documentation Validation

- **validate_documentation_links**: Use when you need to check for broken internal links in your documentation.
- **validate_documentation_metadata**: Use when you need to ensure all documents have required metadata fields.

## Best Practices

1. **Error Handling**: Always check for the `isError` flag in the response to handle errors appropriately.

2. **Path Handling**: Paths can be relative to the allowed directories or absolute. If using absolute paths, ensure they are within the allowed directories.

3. **Performance Considerations**: For large documentation repositories, consider using more specific tools (like `read_document` for a specific file) rather than broader tools (like `generate_documentation_navigation` for the entire repository).

4. **Metadata Usage**: Take advantage of the metadata extracted from markdown frontmatter to organize and structure your documentation.
