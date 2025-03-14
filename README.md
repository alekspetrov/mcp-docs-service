# MCP Documentation Service

<a href="https://glama.ai/mcp/servers/icfujodcjd">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/icfujodcjd/badge" />
</a>

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

Requires Node to be installed on your machine.

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

To use MCP Docs Service with Claude Desktop:

1. **Install Claude Desktop** - Download the latest version from [Claude's website](https://claude.ai/desktop).

2. **Configure Claude Desktop for MCP**:

   - Open Claude Desktop
   - Click on the Claude menu and select "Developer Settings"
   - This will create a configuration file at:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. **Edit the configuration file** to add the MCP Docs Service:

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

Make sure to replace `/path/to/your/docs` with the absolute path to your documentation directory.

4. **Restart Claude Desktop** completely.

5. **Verify the tool is available** - After restarting, you should see a green dot for docs-manager MCP tool (Cursor Settings > MCP)

6. **Troubleshooting**:
   - If the server doesn't appear, check the logs at:
     - macOS: `~/Library/Logs/Claude/mcp*.log`
     - Windows: `%APPDATA%\Claude\logs\mcp*.log`
   - Ensure Node.js is installed on your system
   - Make sure the paths in your configuration are absolute and valid

## Examples

### Using with Claude in Cursor

When using Claude in Cursor, you can invoke the tools in two ways:

1. **Using Natural Language** (Recommended):
   - Simply ask Claude to perform the task in plain English:

```
Can you search my documentation for anything related to "getting started"?
```

```
Please list all the markdown files in my docs directory.
```

```
Could you check if there are any issues with my documentation?
```

2. **Using Direct Tool Syntax**:
   - For more precise control, you can use the direct tool syntax:

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

When using Claude Desktop, you can invoke the tools in two ways:

1. **Using Natural Language** (Recommended):

```
Can you read the README.md file for me?
```

```
Please find all documents that mention "API" in my documentation.
```

```
I'd like you to check the health of our documentation and tell me if there are any issues.
```

2. **Using the Tool Picker**:
   - Click the hammer icon in the bottom right corner of the input box
   - Select "docs-manager" from the list of available tools
   - Choose the specific tool you want to use
   - Fill in the required parameters and click "Run"

Claude will interpret your natural language requests and use the appropriate tool with the correct parameters. You don't need to remember the exact tool names or parameter formats - just describe what you want to do!

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

- [Getting Started Guide](https://github.com/alekspetrov/mcp-docs-service/blob/main/docs/guides/getting-started.md)
- [MCP Integration Guide](https://github.com/alekspetrov/mcp-docs-service/blob/main/docs/guides/mcp-integration.md)
- [MCP Protocol Usage](https://github.com/alekspetrov/mcp-docs-service/blob/main/docs/guides/mcp-protocol-usage.md)
- [API Reference](https://github.com/alekspetrov/mcp-docs-service/blob/main/docs/api/tools-reference.md)
- [Examples](https://github.com/alekspetrov/mcp-docs-service/blob/main/docs/examples/basic-usage.md)

## License

MIT
