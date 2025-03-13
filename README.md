# MCP Documentation Service

The MCP Documentation Service is a custom implementation of the Model Context Protocol that allows AI assistants to interact with documentation. This service enables the creation, reading, updating, and deletion of documentation files, as well as searching and analyzing the documentation.

## Features

- **Document Management**: Create, read, update, and delete markdown documentation files
- **Metadata Management**: Work with document frontmatter (YAML metadata)
- **Search**: Search through documentation using keywords and filters
- **Knowledge Base Generation**: Create comprehensive knowledge bases for LLM context
- **Structure Analysis**: Analyze documentation structure and relationships
- **Navigation Generation**: Generate navigation structures for documentation
- **Tag Management**: Organize documentation by tags and categories
- **Analytics**: Analyze documentation health and get suggestions for improvement
- **Custom Directory Support**: Specify a custom docs directory and create it if it doesn't exist

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Getting Started Guide](docs/guides/getting-started.md) - Introduction to the MCP Docs Manager
- [API Overview](docs/api/overview.md) - Overview of the API and available tools
- [Tools Reference](docs/api/tools-reference.md) - Complete reference of all available tools
- [Features Overview](docs/features.md) - Comprehensive overview of all features
- [Basic Usage Tutorial](docs/tutorials/basic-usage.md) - Tutorial for basic usage
- [Examples](docs/examples/) - Code examples for common tasks
  - [Navigation Generator](docs/examples/navigation-generator.md) - Example of how to generate navigation for documentation
  - [Knowledge Base Generator](docs/examples/knowledge-base-generator.md) - Example of how to generate a knowledge base for LLM context
- [Roadmap](docs/roadmap.md) - Development roadmap and planned features

## Installation

### Via npx (Recommended)

The easiest way to use MCP Documentation Service is through npx:

```bash
# Use default docs directory (./docs)
npx mcp-docs-service

# Specify a custom docs directory
npx mcp-docs-service --docs-dir ./my-custom-docs

# Create the directory if it doesn't exist
npx mcp-docs-service --docs-dir ./my-custom-docs --create-dir

# Show help
npx mcp-docs-service --help
```

### Global Installation

You can also install it globally:

```bash
npm install -g mcp-docs-service

# Then use it with the same options as npx
mcp-docs-service --docs-dir ./my-custom-docs --create-dir
```

### Local Installation

If you prefer to install it locally in your project:

```bash
npm install mcp-docs-service
```

### Command-Line Options

The MCP Documentation Service supports the following command-line options:

- `--docs-dir <path>`: Specify the docs directory (default: ./docs)
- `--create-dir`: Create the docs directory if it doesn't exist
- `--help`, `-h`: Show help message

## Integration

### With Cursor IDE

Add this to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service"]
    }
  }
}
```

This configuration will use the default `docs` directory in your project root. If you want to specify a custom docs directory:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "./my-custom-docs", "--create-dir"]
    }
  }
}
```

### With Claude Desktop

Add this to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service"]
    }
  }
}
```

To specify a custom docs directory:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-docs-service",
        "--docs-dir",
        "./my-custom-docs",
        "--create-dir"
      ]
    }
  }
}
```

## Programmatic Usage

You can also use MCP Documentation Service programmatically in your Node.js application:

```javascript
const { MCPDocsServer } = require("mcp-docs-service");

// Create a new MCP server instance with default docs directory
const server = new MCPDocsServer("./docs");

// Or with a custom docs directory
const customServer = new MCPDocsServer("./my-custom-docs", {
  createIfNotExists: true, // Create the directory if it doesn't exist
  fileExtensions: [".md", ".mdx"], // Specify file extensions to consider (optional)
});

// Execute a query
async function example() {
  try {
    const result = await server.executeQuery("list_files");
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

example();
```

You can also use the query function directly:

```javascript
const { query } = require("mcp-docs-service");

// Execute a query with a custom docs directory
async function example() {
  try {
    const result = await query("list_files", {
      docsDir: "./my-custom-docs",
      createIfNotExists: true,
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

example();
```

## Query Format

The service uses a SQL-like query format to execute commands:

```
command_name(param1="value1", param2="value2")
```

For example:

```
get_document(path="architecture/overview.md")
```

## Available Commands

### Documentation Tools

- **read_document(path="path/to/doc.md")**: Read a markdown document and extract its content and metadata
- **list_documents(basePath="")**: List all markdown documents in a directory
- **get_structure(basePath="")**: Get the structure of the documentation directory
- **get_navigation(basePath="")**: Get the navigation structure for the documentation
- **get_docs_knowledge_base(basePath="", includeSummaries=true, maxSummaryLength=500)**: Create a comprehensive knowledge base of documentation for LLM context
- **write_document(path="path/to/doc.md", content="content", metadata={...})**: Write content to a markdown document with frontmatter
- **edit_document(path="path/to/doc.md", edits=[{oldText: "...", newText: "..."}])**: Apply edits to a markdown document while preserving frontmatter
- **delete_document(path="path/to/doc.md")**: Delete a markdown document
- **search_documents(basePath="", query="search term", tags=["tag1"], status="published")**: Search for markdown documents matching criteria

## License

MIT
