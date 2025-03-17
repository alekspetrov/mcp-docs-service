---
title: Enhanced Structure Management
description: Guide for using the enhanced structure management features of the MCP Docs Manager
author: Claude
date: 2024-06-01
tags:
  - guide
  - structure
  - management
status: published
order: 4
---

# Enhanced Structure Management

This guide explains how to use the enhanced structure management features of the MCP Docs Manager service.

## Creating Folders

You can create new folders in your documentation structure using the `create_documentation_folder` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "create_documentation_folder",
  arguments: {
    path: "docs/new-section",
    createReadme: true,
  },
});
```

This will create a new folder at the specified path and optionally create a README.md file with basic frontmatter.

## Moving Documents

You can move documents from one location to another using the `move_document` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "move_document",
  arguments: {
    sourcePath: "docs/old-location/document.md",
    destinationPath: "docs/new-location/document.md",
    updateReferences: true,
  },
});
```

This will move the document to the new location and optionally update references to the document in other files.

## Renaming Documents

You can rename documents while preserving their location and content using the `rename_document` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "rename_document",
  arguments: {
    path: "docs/section/old-name.md",
    newName: "new-name",
    updateReferences: true,
  },
});
```

This will rename the document and optionally update references to the document in other files. The tool will also update the title in the document's frontmatter if it exists.

## Updating Navigation Order

You can change the order of documents in navigation by updating the `order` field in the frontmatter:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "update_documentation_navigation_order",
  arguments: {
    path: "docs/section/document.md",
    order: 3,
  },
});
```

This will update the `order` field in the document's frontmatter, which affects its position in the navigation.

## Creating Sections

You can create new navigation sections with an index.md file:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "create_documentation_section",
  arguments: {
    title: "New Section",
    path: "docs/new-section",
    order: 5,
  },
});
```

This will create a new folder with an index.md file that has the appropriate frontmatter for a section.

## Best Practices

1. **Maintain References**: When moving or renaming documents, always set `updateReferences` to `true` to ensure that links to the document are updated in other files.

2. **Use Consistent Naming**: Use consistent naming conventions for folders and files to make your documentation structure more intuitive.

3. **Order Documents Logically**: Use the `order` field in frontmatter to arrange documents in a logical sequence within each section.

4. **Create Section Indexes**: Always create an index.md file for each section to provide an overview of the section's contents.

5. **Update Navigation**: After making structural changes, regenerate the navigation using the `generate_documentation_navigation` tool to ensure it reflects the current structure.
