---
title: MCP Documentation
description: Main documentation index for the MCP Docs Manager
author: Claude
date: 2023-11-15T00:00:00.000Z
tags:
  - index
  - documentation
status: published
---

# MCP Documentation

Welcome to the MCP Docs Manager documentation. This documentation will help you understand how to use the MCP Docs Manager to manage your project documentation.

## Documentation Structure

- [Getting Started](guides/getting-started.md): Introduction to the MCP Docs Manager
- [API Overview](api/overview.md): Overview of the MCP Docs Manager API
- [Tools Reference](api/tools-reference.md): Complete reference of all available tools
- [Features Overview](features.md): Comprehensive overview of all features
- [Tutorials](tutorials/basic-usage.md): Step-by-step guides for common tasks
  - [Basic Usage](tutorials/basic-usage.md): Learn how to use the MCP Docs Manager for basic documentation tasks
- [Examples](examples/documentation-health-check.md): Code examples for common tasks
  - [Navigation Generator](examples/navigation-generator.md): Example of how to generate navigation for documentation
  - [Knowledge Base Generator](examples/knowledge-base-generator.md): Example of how to generate a comprehensive knowledge base for documentation
- [Guides](guides/getting-started.md): Detailed guides for specific topics
  - [Getting Started](guides/getting-started.md): Introduction to the MCP Docs Manager
  - [MCP Integration](guides/mcp-integration.md): Guide for integrating with the Model Context Protocol
  - [MCP Protocol Usage](guides/mcp-protocol-usage.md): Guide for using the correct MCP protocol methods
  - [Cursor Integration](guides/cursor-integration.md): Guide for integrating the MCP Docs Service with Cursor
  - [Enhanced Structure Management](guides/enhanced-structure-management.md): Guide for using the enhanced structure management features
  - [Documentation Validation](guides/documentation-validation.md): Guide for validating documentation quality
  - [Publishing to npm](guides/publishing.md): Guide for publishing the MCP Docs Service to npm
- [Roadmap](roadmap.md): Development roadmap and planned features
- [Changelog](CHANGELOG.md): Version history and changes

## Features

The MCP Docs Manager provides the following tools:

### Basic Document Operations

- Reading and writing documentation files with metadata (frontmatter)
- Editing documentation with line-based changes
- Listing and searching for documentation based on content or metadata

### Navigation and Structure

- Generating navigation structures for documentation
- Checking documentation health and quality

### Enhanced Structure Management

- Creating folders and sections for documentation
- Moving and renaming documents while maintaining references
- Updating navigation order of documents

### Documentation Validation

- Validating links in documentation
- Ensuring documents have required metadata
- Identifying issues like missing metadata and broken links
- Calculating documentation health scores

All tools are integrated with the Model Context Protocol (MCP) and can be easily used with Cursor, Windsurf, or Claude Desktop via npx.

## Contributing

To contribute to this documentation, please follow these guidelines:

1. Use consistent formatting and style
2. Include appropriate frontmatter in all documents
3. Link related documents together
4. Organize documents in a logical directory structure
5. Follow the naming conventions
6. Update the main README when adding new documents

## Documentation Health

We use the MCP Docs Manager to analyze the health of our documentation. The health score is based on:

- Completeness of metadata
- Presence of tags and status
- Document length and quality
- Proper linking between documents
