# MCP Documentation Service

## What is it?

MCP Documentation Service is a Model Context Protocol (MCP) implementation for documentation management. It provides a set of tools for reading, writing, and managing markdown documentation with frontmatter metadata. The service is designed to work seamlessly with AI assistants like Claude in Cursor or Claude Desktop, making it easy to manage your documentation through natural language interactions.

## Features

- **Read and Write Documents**: Easily read and write markdown documents with frontmatter metadata
- **Edit Documents**: Make precise line-based edits to documents with diff previews
- **List and Search**: Find documents by content or metadata
- **Navigation Generation**: Create navigation structures from your documentation
- **Health Checks**: Analyze documentation quality and identify issues like missing metadata or broken links
- **MCP Integration**: Seamless integration with the Model Context Protocol
- **Frontmatter Support**: Full support for YAML frontmatter in markdown documents
- **Markdown Compatibility**: Works with standard markdown files

## Quick Start

### Installation

```bash
npm install -g mcp-docs-service
```

Or use directly with npx:

```bash
npx mcp-docs-service /path/to/docs
```

### Cursor Integration

To use with Cursor, create a `.cursor/mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "/path/to/your/docs"]
    }
  }
}
```

### Claude Desktop Integration

For Claude Desktop, you can run the service in a terminal:

```bash
mcp-docs-service --docs-dir /path/to/docs
```

Then configure Claude Desktop to use the service as an MCP tool.

## Examples

### Using with Claude in Cursor

When using Claude in Cursor, you can invoke the tools directly in your conversation:

```
@docs-manager mcp_docs_manager_read_document path=docs/getting-started.md
```

```
@docs-manager mcp_docs_manager_list_documents recursive=true
```

```
@docs-manager mcp_docs_manager_check_documentation_health
```

### Using with Claude Desktop

When using Claude Desktop, you can invoke the tools in your conversation:

```
Please use the docs-manager tool to read the file README.md
```

```
Please use the docs-manager tool to list all documents in the docs directory
```

```
Please use the docs-manager tool to check the health of the documentation
```

### Common Tool Commands

Here are some common commands you can use with the tools:

#### Reading a Document

```
@docs-manager mcp_docs_manager_read_document path=docs/getting-started.md
```

#### Writing a Document

```
@docs-manager mcp_docs_manager_write_document path=docs/new-document.md content="---
title: New Document
description: A new document created with MCP Docs Service
---

# New Document

This is a new document created with MCP Docs Service."
```

#### Editing a Document

```
@docs-manager mcp_docs_manager_edit_document path=README.md edits=[{"oldText":"# Documentation", "newText":"# Project Documentation"}]
```

#### Searching Documents

```
@docs-manager mcp_docs_manager_search_documents query="getting started"
```

#### Generating Navigation

```
@docs-manager mcp_docs_manager_generate_navigation
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

Please make sure your code follows the existing style and includes appropriate tests.

## Documentation Health

We use the MCP Docs Service to maintain the health of our own documentation. The health score is based on:

- Completeness of metadata (title, description, etc.)
- Presence of broken links
- Orphaned documents (not linked from anywhere)
- Consistent formatting and style

You can check the health of your documentation with:

```bash
mcp-docs-service --health-check
```

## Documentation

For more detailed information, check out our documentation:

- [Getting Started Guide](docs/guides/getting-started.md)
- [MCP Integration Guide](docs/guides/mcp-integration.md)
- [MCP Protocol Usage](docs/guides/mcp-protocol-usage.md)
- [API Reference](docs/api/tools-reference.md)
- [Examples](docs/examples/basic-usage.md)

## License

MIT
