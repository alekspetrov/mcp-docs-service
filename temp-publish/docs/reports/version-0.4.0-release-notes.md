---
title: Version 0.4.0 Release Notes
description: Release notes for MCP Docs Manager version 0.4.0
author: Claude
date: 2024-06-01
tags:
  - release
  - notes
  - version
status: published
---

# Version 0.4.0 Release Notes

We're excited to announce the release of MCP Docs Manager version 0.4.0, which includes significant enhancements to documentation structure management and validation capabilities.

## New Features

### Enhanced Structure Management

- **Create Folder**: Create new documentation sections/folders with optional README.md files
- **Move Document**: Move documentation files between sections with automatic reference updates
- **Rename Document**: Rename documentation files while maintaining references
- **Update Navigation Order**: Change the order of documents in navigation by updating frontmatter
- **Create Section**: Add new navigation sections with properly structured index files

### Documentation Validation

- **Validate Links**: Check for broken internal links in documentation files
- **Validate Metadata**: Ensure all documents have required metadata fields

## Documentation Updates

- Added new guide: [Enhanced Structure Management](../guides/enhanced-structure-management.md)
- Added new guide: [Documentation Validation](../guides/documentation-validation.md)
- Updated navigation and README to include new guides
- Updated roadmap to reflect completed features

## Technical Improvements

- Improved error handling for file operations
- Enhanced reference updating when moving or renaming documents
- Added support for recursive link validation
- Implemented metadata completeness percentage calculation

## Getting Started with New Features

To start using the new features, update to version 0.4.0:

```bash
npm install mcp-docs-service@0.4.0
```

Check out the [Enhanced Structure Management](../guides/enhanced-structure-management.md) and [Documentation Validation](../guides/documentation-validation.md) guides for detailed usage instructions.

## What's Next

We're continuing to work on the remaining roadmap items, with a focus on:

- Batch operations for document management
- Finding missing references between documents
- Knowledge base health monitoring
- Semantic search capabilities

Stay tuned for more updates!