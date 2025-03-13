# MCP Documentation Service

A Model Context Protocol (MCP) implementation for documentation management. This service provides tools for reading, writing, and managing markdown documentation.

## Features

- **Read and Write Documents**: Easily read and write markdown documents with frontmatter
- **Edit Documents**: Make precise edits to documents with diff previews
- **List and Search**: Find documents by content or metadata
- **Navigation Generation**: Create navigation structures from your documentation
- **Health Checks**: Analyze documentation quality and identify issues

## Installation

```bash
npm install -g mcp-docs-service
```

Or use directly with npx:

```bash
npx mcp-docs-service
```

## Usage

### Command Line

```bash
# Use with default docs directory (./docs)
mcp-docs-service

# Specify a custom docs directory
mcp-docs-service /path/to/docs

# Create docs directory if it doesn't exist
mcp-docs-service --create-dir

# Run a health check on your documentation
mcp-docs-service --health-check
```

### Cursor Integration

To use with Cursor, create a `.cursor/mcp.json` file with:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "mcp-docs-service-cursor",
      "args": ["/path/to/your/docs"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

> **Note**: For Cursor integration, use the `mcp-docs-service-cursor` command instead of `mcp-docs-service`. This special wrapper ensures proper stdio handling for Cursor's MCP protocol communication.

## Available Tools

The service provides the following tools:

- `read_document`: Read a markdown document
- `write_document`: Create or overwrite a document
- `edit_document`: Make precise edits to a document
- `list_documents`: List all documents in a directory
- `search_documents`: Find documents containing specific text
- `generate_navigation`: Create a navigation structure
- `check_documentation_health`: Analyze documentation quality

## Example

Using with Claude in Cursor:

```
@docs-manager read_document path=README.md
```

```
@docs-manager edit_document path=README.md edits=[{"oldText":"# Documentation", "newText":"# Project Documentation"}]
```

## License

MIT
