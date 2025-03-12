---
title: Getting Started with MCP Docs Manager
description: Introduction to the MCP Docs Manager and how to use it
author: Claude
date: 2023-03-11
tags:
  - guide
  - introduction
  - basics
status: published
order: 1
---

# Getting Started with MCP Docs Manager

Welcome to the MCP Docs Manager! This guide will help you understand how to use the MCP Docs Manager to manage your project documentation effectively.

## What is MCP Docs Manager?

MCP Docs Manager is a specialized service for managing documentation written in Markdown. It provides tools for:

- Reading and writing documentation files with metadata (frontmatter)
- Organizing documentation in a structured way
- Generating navigation for documentation
- Validating documentation quality and health

## Setting Up

The MCP Docs Manager is integrated with the Model Context Protocol (MCP) and can be used through the MCP interface. To set it up:

1. Ensure you have the MCP Docs Manager service configured in your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "node",
      "args": ["/path/to/mcp-docs-service/dist/index.js", "/path/to/your/docs"]
    }
  }
}
```

2. Make sure your documentation directory exists and is accessible.

## Basic Usage

### Reading Documentation

To read a documentation file:

```typescript
const result = await mcp.callTool("docs-manager", "read_document", {
  path: "path/to/document.md",
});

console.log(result.metadata); // Document metadata
console.log(result.content); // Document content
```

### Listing Documentation

To list all documentation files:

```typescript
const result = await mcp.callTool("docs-manager", "list_documents", {
  basePath: "path/to/docs",
});

console.log(result.documents); // Array of document entries
```

### Getting Documentation Structure

To get the structure of your documentation:

```typescript
const result = await mcp.callTool("docs-manager", "get_structure", {
  basePath: "path/to/docs",
});

console.log(result.structure); // Hierarchical structure of documentation
```

### Getting Navigation

To generate navigation for your documentation:

```typescript
const result = await mcp.callTool("docs-manager", "get_navigation", {
  basePath: "path/to/docs",
});

console.log(result.navigation); // Navigation structure
```

### Writing Documentation

To create or update a documentation file:

```typescript
const result = await mcp.callTool("docs-manager", "write_document", {
  path: "path/to/document.md",
  content: "# My Document\n\nThis is the content of my document.",
  metadata: {
    title: "My Document",
    description: "A sample document",
    author: "Your Name",
    date: "2023-03-12",
    tags: ["sample", "documentation"],
    status: "published",
    order: 1,
  },
});

console.log(result.success); // true if successful
```

### Editing Documentation

To make specific edits to a documentation file while preserving frontmatter:

```typescript
const result = await mcp.callTool("docs-manager", "edit_document", {
  path: "path/to/document.md",
  edits: [
    {
      oldText: "This is the content of my document.",
      newText: "This is the updated content of my document.",
    },
  ],
});

console.log(result.success); // true if successful
```

### Deleting Documentation

To delete a documentation file:

```typescript
const result = await mcp.callTool("docs-manager", "delete_document", {
  path: "path/to/document.md",
});

console.log(result.success); // true if successful
```

### Searching Documentation

To search for documentation files based on content or metadata:

```typescript
const result = await mcp.callTool("docs-manager", "search_documents", {
  basePath: "path/to/docs",
  query: "search term",
  tags: ["guide", "tutorial"],
  status: "published",
});

console.log(result.documents); // Array of matching document entries
```

## Document Metadata

MCP Docs Manager uses YAML frontmatter for document metadata. Each document should include metadata at the top of the file:

```markdown
---
title: Document Title
description: Brief description of the document
author: Author Name
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
status: draft|published|archived
order: 1
---

# Document Content
```

The following metadata fields are supported:

- `title`: The title of the document
- `description`: A brief description of the document
- `author`: The author of the document
- `date`: The date the document was created or last updated
- `tags`: An array of tags for categorizing the document
- `status`: The status of the document (draft, published, archived)
- `order`: The order of the document in navigation (lower numbers appear first)

## Next Steps

Now that you're familiar with the basics of MCP Docs Manager, you can:

- Explore the [API Overview](../api/overview.md) for more details on available tools
- Check out the [Tutorials](../tutorials/) for step-by-step guides
- Review the [Roadmap](../roadmap.md) to see planned features and enhancements

## Troubleshooting

If you encounter issues with the MCP Docs Manager:

1. Ensure your documentation directory is correctly specified in the configuration
2. Check that your markdown files have valid frontmatter
3. Verify that the MCP Docs Manager service is running

For more help, please refer to the [Troubleshooting Guide](troubleshooting.md) or open an issue in the repository.
