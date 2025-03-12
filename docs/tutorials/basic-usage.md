---
title: Basic Usage Tutorial
description: Learn how to use the MCP Docs Manager for basic documentation tasks
author: Claude
date: 2023-03-12
tags:
  - tutorial
  - beginner
  - examples
status: published
order: 1
---

# Basic Usage Tutorial

This tutorial will guide you through the basic usage of the MCP Docs Manager for common documentation tasks.

## Prerequisites

- Node.js 16 or higher
- MCP SDK installed
- MCP Docs Manager service running

## Setting Up

First, make sure you have the MCP Docs Manager service running. You can start it by pointing it to your documentation directory:

```bash
node dist/index.js /path/to/your/docs
```

## Working with Documentation

The MCP Docs Manager provides specialized tools for working with markdown documentation files. Here's how to read a document:

```typescript
// Example: Reading a document
async function readDocExample() {
  const result = await mcp.callTool("docs-manager", "read_document", {
    path: "docs/guides/getting-started.md",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log("Document content:", result.metadata.content);
  console.log("Document metadata:", result.metadata.metadata);
}
```

## Listing Documents

To get a list of all markdown documents in a directory:

```typescript
// Example: Listing documents
async function listDocsExample() {
  const result = await mcp.callTool("docs-manager", "list_documents", {
    basePath: "docs",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log(`Found ${result.metadata.documents.length} documents`);

  // Print document titles
  result.metadata.documents.forEach((doc) => {
    console.log(`- ${doc.metadata.title || doc.name} (${doc.path})`);
  });
}
```

## Getting Documentation Structure

To understand the structure of your documentation:

```typescript
// Example: Getting documentation structure
async function getStructureExample() {
  const result = await mcp.callTool("docs-manager", "get_structure", {
    basePath: "docs",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  // Print the structure recursively
  function printStructure(entry, indent = 0) {
    const indentStr = " ".repeat(indent * 2);
    console.log(`${indentStr}- ${entry.name} (${entry.type})`);

    if (entry.children && entry.children.length > 0) {
      entry.children.forEach((child) => printStructure(child, indent + 1));
    }
  }

  printStructure(result.metadata.structure);
}
```

## Generating Navigation

To generate a navigation structure for your documentation:

```typescript
// Example: Generating navigation
async function getNavigationExample() {
  const result = await mcp.callTool("docs-manager", "get_navigation", {
    basePath: "docs",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  // Print the navigation
  result.metadata.navigation.forEach((section) => {
    console.log(`Section: ${section.title}`);

    section.items.forEach((item) => {
      console.log(`  - ${item.title} (${item.path})`);
    });
  });
}
```

## Writing Documentation

Let's see how to create or update a markdown document with frontmatter:

```typescript
// Example: Writing a document
async function writeDocExample() {
  const result = await mcp.callTool("docs-manager", "write_document", {
    path: "docs/examples/example-doc.md",
    content:
      "# Example Document\n\nThis is an example document created with write_document.",
    metadata: {
      title: "Example Document",
      description: "An example document created with write_document",
      author: "MCP Docs Manager",
      date: new Date().toISOString().split("T")[0],
      tags: ["example", "documentation"],
      status: "draft",
      order: 1,
    },
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log("Document written successfully to:", result.metadata.path);
}
```

## Editing Documentation

You can make specific edits to a markdown document while preserving its frontmatter:

```typescript
// Example: Editing a document
async function editDocExample() {
  const result = await mcp.callTool("docs-manager", "edit_document", {
    path: "docs/examples/example-doc.md",
    edits: [
      {
        oldText: "This is an example document created with write_document.",
        newText:
          "This is an example document that has been edited with edit_document.",
      },
    ],
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log("Document edited successfully");
}
```

## Deleting Documentation

To delete a markdown document:

```typescript
// Example: Deleting a document
async function deleteDocExample() {
  const result = await mcp.callTool("docs-manager", "delete_document", {
    path: "docs/examples/example-doc.md",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log("Document deleted successfully");
}
```

## Searching Documentation

To search for markdown documents based on content or metadata:

```typescript
// Example: Searching documents
async function searchDocsExample() {
  const result = await mcp.callTool("docs-manager", "search_documents", {
    basePath: "docs",
    query: "example",
    tags: ["tutorial"],
    status: "published",
  });

  if (result.isError) {
    console.error("Error:", result.content[0].text);
    return;
  }

  console.log(`Found ${result.metadata.documents.length} matching documents`);

  // Print document titles
  result.metadata.documents.forEach((doc) => {
    console.log(`- ${doc.metadata.title || doc.name} (${doc.path})`);
  });
}
```

## Putting It All Together

Here's a complete example that demonstrates all of the above operations:

```typescript
async function runExample() {
  // Read a document
  const docResult = await mcp.callTool("docs-manager", "read_document", {
    path: "docs/guides/getting-started.md",
  });

  if (!docResult.isError) {
    console.log("Document title:", docResult.metadata.metadata.title);
  }

  // List documents
  const listResult = await mcp.callTool("docs-manager", "list_documents", {
    basePath: "docs",
  });

  if (!listResult.isError) {
    console.log(`Found ${listResult.metadata.documents.length} documents`);
  }

  // Get structure
  const structureResult = await mcp.callTool("docs-manager", "get_structure", {
    basePath: "docs",
  });

  if (!structureResult.isError) {
    console.log("Structure retrieved successfully");
  }

  // Get navigation
  const navResult = await mcp.callTool("docs-manager", "get_navigation", {
    basePath: "docs",
  });

  if (!navResult.isError) {
    console.log(
      `Generated navigation with ${navResult.metadata.navigation.length} sections`
    );
  }

  // Write a new document
  const writeResult = await mcp.callTool("docs-manager", "write_document", {
    path: "docs/examples/example.md",
    content:
      "# Example Document\n\nThis document was created by the MCP Docs Manager tutorial.",
    metadata: {
      title: "Example Document",
      description: "An example document created by the tutorial",
      author: "MCP Docs Manager",
      date: new Date().toISOString().split("T")[0],
      tags: ["example", "tutorial"],
      status: "draft",
      order: 1,
    },
  });

  if (!writeResult.isError) {
    console.log("Example document created successfully");
  }

  // Edit the document
  const editResult = await mcp.callTool("docs-manager", "edit_document", {
    path: "docs/examples/example.md",
    edits: [
      {
        oldText: "This document was created by the MCP Docs Manager tutorial.",
        newText:
          "This document was created and then edited by the MCP Docs Manager tutorial.",
      },
    ],
  });

  if (!editResult.isError) {
    console.log("Example document edited successfully");
  }

  // Search for documents
  const searchResult = await mcp.callTool("docs-manager", "search_documents", {
    basePath: "docs",
    query: "example",
    tags: ["tutorial"],
  });

  if (!searchResult.isError) {
    console.log(
      `Found ${searchResult.metadata.documents.length} matching documents`
    );
  }

  // Delete the document (commented out to keep the example)
  /*
  const deleteResult = await mcp.callTool("docs-manager", "delete_document", {
    path: "docs/examples/example.md"
  });

  if (!deleteResult.isError) {
    console.log("Example document deleted successfully");
  }
  */
}

runExample().catch(console.error);
```

## Next Steps

Now that you've learned the basics of using the MCP Docs Manager, you can:

- Explore the [API Overview](../api/overview.md) for more details on available tools
- Check out the [Tools Reference](../api/tools-reference.md) for a complete reference of all available tools
- Review the [Roadmap](../roadmap.md) to see planned features and enhancements
- Start building your own documentation management system using the MCP Docs Manager

Remember that the MCP Docs Manager provides two categories of tools:

1. **Documentation Tools**: Specialized for working with markdown documentation files with frontmatter
2. **File Operations Tools**: General-purpose tools for working with any type of file

For documentation management, always prefer the documentation-specific tools as they are designed to handle markdown files with frontmatter properly.

If you have any questions or need help, please refer to the [Troubleshooting Guide](troubleshooting.md) or open an issue in the repository.

## Troubleshooting

If you encounter any issues:

1. Make sure the MCP Docs Manager service is running
2. Check that you're using the correct paths relative to the allowed directories
3. Verify that your markdown documents have valid frontmatter
4. Check the error messages in the response for specific issues
