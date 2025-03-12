---
title: API Overview
description: Overview of the MCP Docs Manager API and available tools
author: Claude
date: 2023-03-11
tags:
  - api
  - reference
  - tools
status: published
order: 1
---

# MCP Docs Manager API Overview

This document provides an overview of the MCP Docs Manager API and the tools available for managing documentation.

## Available Tools

The MCP Docs Manager provides specialized tools for working with markdown documentation files with frontmatter.

For a complete reference of all available tools, see the [Tools Reference](tools-reference.md).

### Documentation Tools

| Tool                      | Description                                                            | Parameters                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read_document`           | Read a markdown document and extract its content and metadata          | `path`: Path to the document                                                                                                                                                                          |
| `list_documents`          | List all markdown documents in a directory                             | `basePath`: (Optional) Base path to search from                                                                                                                                                       |
| `get_structure`           | Get the structure of the documentation directory                       | `basePath`: (Optional) Base path to get structure from                                                                                                                                                |
| `get_navigation`          | Get the navigation structure for the documentation                     | `basePath`: (Optional) Base path to generate navigation from                                                                                                                                          |
| `get_docs_knowledge_base` | Create a comprehensive knowledge base of documentation for LLM context | `basePath`: (Optional) Base path to generate knowledge base from<br>`includeSummaries`: (Optional) Whether to include content summaries<br>`maxSummaryLength`: (Optional) Maximum length of summaries |
| `write_document`          | Write content to a markdown document with frontmatter                  | `path`: Path to the document<br>`content`: Document content<br>`metadata`: (Optional) Document metadata                                                                                               |
| `edit_document`           | Apply edits to a markdown document while preserving frontmatter        | `path`: Path to the document<br>`edits`: Array of edits to apply                                                                                                                                      |
| `delete_document`         | Delete a markdown document                                             | `path`: Path to the document                                                                                                                                                                          |
| `search_documents`        | Search for markdown documents matching criteria                        | `basePath`: (Optional) Base path to search from<br>`query`: (Optional) Text to search for<br>`tags`: (Optional) Tags to filter by<br>`status`: (Optional) Status to filter by                         |

## Using the API

The MCP Docs Manager API is accessed through the MCP interface. Here's how to use it:

```typescript
// Example: Reading a document
const result = await mcp.callTool("docs-manager", "read_document", {
  path: "path/to/document.md",
});

// Example: Getting documentation structure
const structure = await mcp.callTool("docs-manager", "get_structure", {
  basePath: "path/to/docs",
});
```

## Response Format

All tools return responses in a standard format:

```typescript
{
  content: [
    { type: "text", text: "Operation result message" }
  ],
  metadata: {
    // Tool-specific metadata
    // For example, document content, structure, etc.
  },
  isError?: boolean // Present only if an error occurred
}
```

## Error Handling

If an error occurs during tool execution, the response will include an `isError` flag set to `true` and an error message in the `content` field:

```typescript
{
  content: [
    { type: "text", text: "Error message" }
  ],
  isError: true
}
```

## Next Steps

For more detailed information on using the MCP Docs Manager API, check out:

- [Complete Tools Reference](tools-reference.md)
- [Getting Started Guide](../guides/getting-started.md)
- [Tutorials](../tutorials/) for step-by-step guides
